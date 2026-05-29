import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface Course {
  id: string;
  name: string;
  academic_period: string | null;
  students_count: number;
  school_id: string;
}

interface Student {
  id: string;
  full_name: string;
  national_id: string | null;
  grade: string | null;
}

interface Grade {
  id: string;
  course_id: string;
  student_id: string;
  score: string;
  evaluation_name: string;
  comments: string | null;
  student?: Student;
}

export default function TeacherDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState('');

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);
  const [courseGrades, setCourseGrades] = useState<Grade[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<'students' | 'grades'>('students');

  // Modales
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [evaluationName, setEvaluationName] = useState('');
  const [score, setScore] = useState('');
  const [comments, setComments] = useState('');
  const [modalError, setModalError] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  const [deletingGrade, setDeletingGrade] = useState<Grade | null>(null);
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    setCoursesError('');
    try {
      const res = await apiClient.get<{ success: boolean; data: Course[] }>('/courses');
      setCourses(res.data.data);
    } catch (err: any) {
      setCoursesError(err.response?.data?.error ?? 'Error al cargar cursos.');
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const loadCourseDetail = async (course: Course) => {
    setSelectedCourse(course);
    setLoadingDetail(true);
    setDetailTab('students');
    try {
      // Cargar estudiantes del curso
      const studentsRes = await apiClient.get<{ success: boolean; data: Student[] }>(`/courses/${course.id}/students`);
      setCourseStudents(studentsRes.data.data);

      // Cargar notas de este curso
      const gradesRes = await apiClient.get<{ success: boolean; data: Grade[] }>(`/grades?course_id=${course.id}`);
      setCourseGrades(gradesRes.data.data);
    } catch (err) {
      alert('Error al cargar la información del curso');
    } finally {
      setLoadingDetail(false);
    }
  };

  const reloadGrades = async (courseId: string) => {
    try {
      const gradesRes = await apiClient.get<{ success: boolean; data: Grade[] }>(`/grades?course_id=${courseId}`);
      setCourseGrades(gradesRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreateGrade = (studentId: string) => {
    setModalMode('create');
    setEditingGrade(null);
    setSelectedStudentId(studentId);
    setEvaluationName('');
    setScore('');
    setComments('');
    setModalError('');
    setIsGradeModalOpen(true);
  };

  const handleOpenEditGrade = (grade: Grade) => {
    setModalMode('edit');
    setEditingGrade(grade);
    setSelectedStudentId(grade.student_id);
    setEvaluationName(grade.evaluation_name);
    setScore(parseFloat(grade.score).toString()); // Convierte e.g. "4.50" en "4.5"
    setComments(grade.comments ?? '');
    setModalError('');
    setIsGradeModalOpen(true);
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    if (!selectedStudentId) {
      setModalError('Por favor selecciona un estudiante.');
      return;
    }
    if (!evaluationName.trim()) {
      setModalError('Ingresa el nombre de la evaluación.');
      return;
    }
    const scoreVal = parseFloat(score);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      setModalError('Ingresa una calificación válida entre 0 y 100.');
      return;
    }

    setSubmittingGrade(true);
    setModalError('');

    try {
      if (modalMode === 'create') {
        await apiClient.post('/grades', {
          course_id: selectedCourse.id,
          student_id: selectedStudentId,
          score: scoreVal,
          evaluation_name: evaluationName.trim(),
          comments: comments.trim() || undefined,
        });
      } else {
        if (!editingGrade) return;
        await apiClient.put(`/grades/${editingGrade.id}`, {
          score: scoreVal,
          evaluation_name: evaluationName.trim(),
          comments: comments.trim() || undefined,
        });
      }

      await reloadGrades(selectedCourse.id);
      setIsGradeModalOpen(false);
    } catch (err: any) {
      setModalError(err.response?.data?.error ?? 'Error al guardar la calificación.');
    } finally {
      setSubmittingGrade(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGrade || !selectedCourse) return;
    setConfirmDeleteLoading(true);
    try {
      await apiClient.delete(`/grades/${deletingGrade.id}`);
      await reloadGrades(selectedCourse.id);
      setDeletingGrade(null);
    } catch (err) {
      alert('Error al eliminar la calificación.');
    } finally {
      setConfirmDeleteLoading(false);
    }
  };

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <span className="nav-logo-dot" />CASPETE ACADÉMICO
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/communications')}>
            📬 Comunicados
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
        {/* Encabezado principal */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="dashboard-label">Panel del Docente</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.56px' }}>
              Hola, {user?.full_name?.split(' ')[0]} 👩‍🏫
            </h1>
          </div>
          {!selectedCourse && (
            <button className="btn-ghost" onClick={fetchCourses} style={{ fontSize: 13 }}>
              🔄 Recargar cursos
            </button>
          )}
        </div>

        {/* VISTA GENERAL DE CURSOS */}
        {!selectedCourse && (
          <div className="user-card" style={{ padding: '24px 32px' }}>
            <h2 className="dashboard-label" style={{ marginBottom: 16 }}>Mis Cursos Asignados</h2>

            {loadingCourses && <div style={{ textAlign: 'center', padding: 20 }}>Cargando cursos...</div>}
            {coursesError && <div className="form-error">{coursesError}</div>}

            {!loadingCourses && !coursesError && courses.length === 0 && (
              <div className="roadmap-note" style={{ padding: '32px' }}>
                <p style={{ margin: 0 }}>Aún no tienes cursos asignados para este periodo académico.</p>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Comunícate con el Administrador de tu colegio para que te asigne materias.
                </p>
              </div>
            )}

            {!loadingCourses && courses.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {courses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => loadCourseDetail(course)}
                    style={{
                      padding: '20px 24px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      background: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-brand)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>📚</span>
                      {course.academic_period && (
                        <span className="role-badge" style={{ fontSize: 11, padding: '2px 8px' }}>
                          {course.academic_period}
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>{course.name}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      🎒 {course.students_count} Estudiantes inscritos
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DETALLE DE UN CURSO SELECCIONADO */}
        {selectedCourse && (
          <div>
            {/* Cabecera del Curso */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <button className="btn-ghost" onClick={() => setSelectedCourse(null)} style={{ fontSize: 13 }}>
                ← Volver a Cursos
              </button>
              <div style={{ textAlign: 'right' }}>
                <span className="role-badge" style={{ fontSize: 12, marginBottom: 4 }}>
                  Materia Asignada
                </span>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{selectedCourse.name}</h2>
              </div>
            </div>

            {/* Pestañas de Detalle */}
            <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--color-border)', marginBottom: 20 }}>
              <button
                style={{
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: detailTab === 'students' ? '2px solid var(--color-text)' : 'none',
                  fontWeight: detailTab === 'students' ? 600 : 400,
                  color: detailTab === 'students' ? 'var(--color-text)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                onClick={() => setDetailTab('students')}
              >
                🎒 Estudiantes ({courseStudents.length})
              </button>
              <button
                style={{
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: detailTab === 'grades' ? '2px solid var(--color-text)' : 'none',
                  fontWeight: detailTab === 'grades' ? 600 : 400,
                  color: detailTab === 'grades' ? 'var(--color-text)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                onClick={() => setDetailTab('grades')}
              >
                📊 Calificaciones Registradas ({courseGrades.length})
              </button>
            </div>

            {loadingDetail && <div className="roadmap-note">Cargando información del curso...</div>}

            {!loadingDetail && (
              <div className="user-card" style={{ padding: '24px' }}>
                {/* PESTAÑA ESTUDIANTES */}
                {detailTab === 'students' && (
                  <div>
                    {courseStudents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                        No hay estudiantes inscritos en esta materia.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {courseStudents.map((st) => (
                          <div
                            key={st.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '14px 18px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--color-border)',
                              background: 'var(--color-gray-50)',
                            }}
                          >
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{st.full_name}</p>
                              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                                {st.grade ? `Grado: ${st.grade}` : ''}
                                {st.national_id ? ` · Doc: ${st.national_id}` : ''}
                              </p>
                            </div>
                            <button
                              className="btn-ghost"
                              style={{
                                fontSize: 13,
                                color: 'var(--color-brand-deep)',
                                borderColor: 'rgba(24,226,153,0.3)',
                                padding: '4px 12px',
                              }}
                              onClick={() => handleOpenCreateGrade(st.id)}
                            >
                              ➕ Calificar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PESTAÑA CALIFICACIONES */}
                {detailTab === 'grades' && (
                  <div>
                    {courseGrades.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                        Aún no se han registrado calificaciones para esta clase.{' '}
                        <span
                          style={{ color: 'var(--color-brand-deep)', cursor: 'pointer', fontWeight: 500 }}
                          onClick={() => setDetailTab('students')}
                        >
                          Calificar estudiante
                        </span>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                              <th style={{ padding: '8px 4px', color: 'var(--color-text-muted)' }}>Estudiante</th>
                              <th style={{ padding: '8px 4px', color: 'var(--color-text-muted)' }}>Evaluación</th>
                              <th style={{ padding: '8px 4px', color: 'var(--color-text-muted)' }}>Nota</th>
                              <th style={{ padding: '8px 4px', color: 'var(--color-text-muted)' }}>Observaciones</th>
                              <th style={{ padding: '8px 4px', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {courseGrades.map((g) => (
                              <tr key={g.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '12px 4px', fontWeight: 500 }}>
                                  {g.student?.full_name ?? 'Estudiante'}
                                </td>
                                <td style={{ padding: '12px 4px' }}>{g.evaluation_name}</td>
                                <td style={{ padding: '12px 4px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                  {parseFloat(g.score).toFixed(1)}
                                </td>
                                <td
                                  style={{
                                    padding: '12px 4px',
                                    fontSize: 12,
                                    color: 'var(--color-text-muted)',
                                    maxWidth: 150,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                  title={g.comments ?? ''}
                                >
                                  {g.comments || '—'}
                                </td>
                                <td style={{ padding: '12px 4px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button
                                      className="btn-ghost"
                                      style={{ padding: '2px 8px', fontSize: 11 }}
                                      onClick={() => handleOpenEditGrade(g)}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      className="btn-ghost"
                                      style={{ padding: '2px 8px', fontSize: 11, color: 'var(--color-error)' }}
                                      onClick={() => setDeletingGrade(g)}
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL AGREGAR / EDITAR CALIFICACIÓN */}
      {isGradeModalOpen && selectedCourse && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => !submittingGrade && setIsGradeModalOpen(false)}
        >
          <div
            className="user-card"
            style={{ maxWidth: 440, width: '100%', padding: '32px 28px', marginBottom: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600 }}>
              {modalMode === 'create' ? 'Registrar Calificación' : 'Modificar Calificación'}
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Materia: <strong>{selectedCourse.name}</strong>
            </p>

            <form onSubmit={handleSubmitGrade}>
              {/* Estudiante */}
              <div className="form-group">
                <label className="form-label" htmlFor="grade-student">Estudiante</label>
                {modalMode === 'create' ? (
                  <select
                    id="grade-student"
                    className="form-select"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    disabled={submittingGrade}
                  >
                    <option value="">Selecciona un estudiante...</option>
                    {courseStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="grade-student"
                    className="form-input"
                    type="text"
                    value={courseStudents.find((st) => st.id === selectedStudentId)?.full_name ?? ''}
                    disabled
                    style={{ background: 'var(--color-gray-100)' }}
                  />
                )}
              </div>

              {/* Nombre de la evaluación */}
              <div className="form-group">
                <label className="form-label" htmlFor="grade-evaluation">Evaluación / Nombre de Actividad</label>
                <input
                  id="grade-evaluation"
                  className="form-input"
                  type="text"
                  value={evaluationName}
                  onChange={(e) => setEvaluationName(e.target.value)}
                  placeholder="Ej: Quiz 1, Examen Final, Exposición"
                  disabled={submittingGrade}
                  required
                />
              </div>

              {/* Nota */}
              <div className="form-group">
                <label className="form-label" htmlFor="grade-score">Calificación (0 - 100)</label>
                <input
                  id="grade-score"
                  className="form-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="Ej: 85.5"
                  disabled={submittingGrade}
                  required
                />
              </div>

              {/* Comentarios */}
              <div className="form-group">
                <label className="form-label" htmlFor="grade-comments">Observaciones (Opcional)</label>
                <textarea
                  id="grade-comments"
                  className="form-input"
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Comentarios sobre el rendimiento o retroalimentación..."
                  disabled={submittingGrade}
                  style={{ borderRadius: 12, resize: 'none' }}
                />
              </div>

              {modalError && <p className="form-error">{modalError}</p>}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setIsGradeModalOpen(false)}
                  disabled={submittingGrade}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, marginTop: 0 }}
                  disabled={submittingGrade}
                >
                  {submittingGrade ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMAR ELIMINACIÓN DE NOTA */}
      {deletingGrade && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => !confirmDeleteLoading && setDeletingGrade(null)}
        >
          <div
            className="user-card"
            style={{ maxWidth: 400, width: '100%', padding: '32px 28px', marginBottom: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>⚠️</p>
              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>¿Eliminar calificación?</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                ¿Estás seguro de que deseas eliminar la nota de <strong>{parseFloat(deletingGrade.score).toFixed(1)}</strong> para{' '}
                <strong>{deletingGrade.student?.full_name ?? 'el estudiante'}</strong> en{' '}
                <strong>"{deletingGrade.evaluation_name}"</strong>?
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-ghost"
                style={{ flex: 1 }}
                disabled={confirmDeleteLoading}
                onClick={() => setDeletingGrade(null)}
              >
                Cancelar
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: confirmDeleteLoading ? 'wait' : 'pointer',
                  opacity: confirmDeleteLoading ? 0.7 : 1,
                }}
                disabled={confirmDeleteLoading}
                onClick={handleConfirmDelete}
              >
                {confirmDeleteLoading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
