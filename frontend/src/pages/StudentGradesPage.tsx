import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface Student {
  id: string;
  full_name: string;
  grade: string | null;
  school: { name: string };
}

interface Grade {
  id: string;
  score: string;
  evaluation_name: string;
  comments: string | null;
  course: { name: string };
  teacher: { user: { name: string } };
}

interface CourseGrades {
  courseName: string;
  grades: Grade[];
  average: number;
}

export default function StudentGradesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [gradesError, setGradesError] = useState('');

  const queryStudentId = searchParams.get('student_id');
  const isParent = user?.role === 'PARENT';

  // 1. Cargar estudiantes (hijos) si es Padre
  useEffect(() => {
    if (isParent) {
      setLoadingStudents(true);
      apiClient.get<{ data: { students: Student[] } }>('/students')
        .then(res => {
          const kids = res.data.data.students || [];
          setStudents(kids);
          if (kids.length > 0) {
            // Si hay un query param válido, usarlo. Si no, usar el primer hijo.
            const defaultId = queryStudentId && kids.some(k => k.id === queryStudentId)
              ? queryStudentId
              : kids[0].id;
            setSelectedStudentId(defaultId);
          }
        })
        .catch(() => {
          setGradesError('Error al cargar la información de tus hijos.');
        })
        .finally(() => {
          setLoadingStudents(false);
        });
    } else if (queryStudentId) {
      // Si es administrador o docente y viene un ID por query param, usarlo directamente
      setSelectedStudentId(queryStudentId);
    }
  }, [isParent, queryStudentId]);

  // 2. Cargar notas cuando cambia el estudiante seleccionado
  const fetchGrades = useCallback(async (studentId: string) => {
    if (!studentId) return;
    setLoadingGrades(true);
    setGradesError('');
    try {
      const res = await apiClient.get<{ success: boolean; data: Grade[] }>(`/grades/student/${studentId}`);
      setGrades(res.data.data);
    } catch (err: any) {
      setGradesError(err.response?.data?.error ?? 'Error al cargar calificaciones del estudiante.');
      setGrades([]);
    } finally {
      setLoadingGrades(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchGrades(selectedStudentId);
    }
  }, [selectedStudentId, fetchGrades]);

  // 3. Agrupar notas por Materia (Course) y calcular promedios
  const getGroupedGrades = (): CourseGrades[] => {
    const groups: { [courseName: string]: Grade[] } = {};
    grades.forEach(g => {
      const courseName = g.course?.name ?? 'Materia general';
      if (!groups[courseName]) groups[courseName] = [];
      groups[courseName].push(g);
    });

    return Object.entries(groups).map(([courseName, courseGrades]) => {
      const totalScore = courseGrades.reduce((sum, g) => sum + parseFloat(g.score), 0);
      const avg = courseGrades.length > 0 ? totalScore / courseGrades.length : 0;
      return {
        courseName,
        grades: courseGrades,
        average: avg,
      };
    });
  };

  const grouped = getGroupedGrades();
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Calcular el promedio general de todas las materias
  const generalAverage = grouped.length > 0
    ? grouped.reduce((sum, g) => sum + g.average, 0) / grouped.length
    : 0;

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <span className="nav-logo-dot" />CASPETE
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
            🏠 Inicio
          </button>
          <button className="btn-ghost" onClick={() => navigate('/profile')}>
            Mi perfil
          </button>
          <button className="btn-ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="dashboard-body">
        {/* Encabezado con botón de volver */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn-ghost" onClick={() => navigate(-1)} style={{ padding: '6px 12px' }}>
              ← Volver
            </button>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Boletín de Calificaciones 📊</h1>
          </div>
          {selectedStudentId && (
            <button className="btn-ghost" onClick={() => fetchGrades(selectedStudentId)} style={{ fontSize: 13 }}>
              🔄 Actualizar notas
            </button>
          )}
        </div>

        {/* SELECCIÓN DE HIJO (PARA PADRES DE FAMILIA) */}
        {isParent && students.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 6 }}>
            {students.map((kid) => (
              <button
                key={kid.id}
                onClick={() => {
                  setSelectedStudentId(kid.id);
                  setSearchParams({ student_id: kid.id });
                }}
                className={selectedStudentId === kid.id ? 'btn-primary' : 'btn-ghost'}
                style={{
                  width: 'auto',
                  whiteSpace: 'nowrap',
                  marginTop: 0,
                  padding: '8px 16px',
                  fontSize: 13,
                }}
              >
                👶 {kid.full_name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {loadingStudents && <div className="roadmap-note">Cargando hijos registrados...</div>}

        {/* INFORMACIÓN DEL ESTUDIANTE */}
        {selectedStudent && (
          <div className="user-card" style={{ padding: '16px 24px', marginBottom: 20, background: 'var(--color-brand-light)', border: '1px solid rgba(24,226,153,0.2)' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-brand-deep)', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Estudiante consultado
            </p>
            <h3 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700 }}>{selectedStudent.full_name}</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {selectedStudent.school.name} {selectedStudent.grade ? `· Grado ${selectedStudent.grade}` : ''}
            </p>
          </div>
        )}

        {/* LISTADO DE CALIFICACIONES */}
        {loadingGrades && <div className="roadmap-note">Cargando boletín académico...</div>}
        {gradesError && <div className="form-error">{gradesError}</div>}

        {!loadingGrades && !gradesError && selectedStudentId && grades.length === 0 && (
          <div className="roadmap-note" style={{ padding: 40 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>No hay calificaciones disponibles.</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Las notas del periodo académico actual aún no han sido cargadas por los docentes.
            </p>
          </div>
        )}

        {!loadingGrades && grades.length > 0 && (
          <div>
            {/* Promedio General */}
            {generalAverage > 0 && (
              <div className="user-card" style={{ padding: '20px 24px', textAlign: 'center', marginBottom: 20 }}>
                <p className="dashboard-label" style={{ marginBottom: 4 }}>Promedio Acumulado General</p>
                <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: generalAverage >= 60 ? 'var(--color-brand-deep)' : '#c37d0d', fontFamily: 'var(--font-mono)' }}>
                  {generalAverage.toFixed(1)} / 100
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Basado en {grouped.length} {grouped.length === 1 ? 'materia' : 'materias'} registradas.
                </p>
              </div>
            )}

            {/* Materias */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {grouped.map((group, idx) => (
                <div key={idx} className="user-card" style={{ padding: '24px' }}>
                  {/* Materia Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 12, marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>📘 {group.courseName}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Promedio: </span>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: group.average >= 60 ? 'var(--color-brand-deep)' : '#c37d0d' }}>
                        {group.average.toFixed(1)}
                      </strong>
                    </div>
                  </div>

                  {/* Notas individuales */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {group.grades.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          padding: '10px 14px',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-gray-50)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 12,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{g.evaluation_name}</p>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              por {g.teacher?.user?.name ?? 'Docente'}
                            </span>
                          </div>
                          {g.comments && (
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                              💬 "{g.comments}"
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 14,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: parseFloat(g.score) >= 60 ? 'rgba(24,226,153,0.1)' : 'rgba(212,86,86,0.1)',
                            color: parseFloat(g.score) >= 60 ? 'var(--color-brand-deep)' : 'var(--color-error)'
                          }}>
                            {parseFloat(g.score).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
