import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface Teacher {
  id: string;
  user: {
    name: string;
    email: string;
  };
}

interface Student {
  id: string;
  full_name: string;
  grade: string | null;
}

interface Course {
  id: string;
  name: string;
  academic_period: string | null;
  teacher: Teacher;
  students: Student[];
}

export default function CoursesPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Contactos y listas para formularios
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [name, setName] = useState('');
  const [academicPeriod, setAcademicPeriod] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal Inscripción de alumnos
  const [enrollTarget, setEnrollTarget] = useState<Course | null>(null);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<string[]>([]);
  const [selectedEnrollStudentId, setSelectedEnrollStudentId] = useState('');
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);

  // Modal eliminar
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get<{ success: boolean; data: { courses: Course[] } }>('/courses');
      setCourses(res.data.data.courses);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al cargar los cursos escolares.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDependencies = useCallback(async () => {
    try {
      // 1. Cargar docentes (usuarios filtrados por rol TEACHER en el backend)
      const teachersRes = await apiClient.get<any[]>('/users?role=TEACHER');
      // Mapeamos a estructura Teacher { id: teacher_id, user: { name } }
      const teacherUsers = teachersRes.data.map(u => ({
        id: u.teacher?.id ?? '',
        user: { name: u.name, email: u.email }
      })).filter(t => t.id !== ''); // Filtra si no tiene perfil de teacher
      setTeachers(teacherUsers);

      // 2. Cargar todos los alumnos activos del colegio para matrículas
      const studentsRes = await apiClient.get<{ data: { students: Student[] } | Student[] }>('/students?active=true&limit=500');
      const kids = Array.isArray(studentsRes.data) 
        ? studentsRes.data 
        : (studentsRes.data as any).data?.students ?? (studentsRes.data as any).students ?? [];
      setAllStudents(kids);
    } catch (err) {
      console.error('Error al cargar dependencias de cursos', err);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
    loadDependencies();
  }, [fetchCourses, loadDependencies]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingCourse(null);
    setName('');
    setAcademicPeriod('');
    setTeacherId('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setModalMode('edit');
    setEditingCourse(course);
    setName(course.name);
    setAcademicPeriod(course.academic_period ?? '');
    setTeacherId(course.teacher?.id ?? '');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError('Ingresa el nombre de la materia.');
      return;
    }
    if (!teacherId) {
      setModalError('Selecciona un docente responsable.');
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      if (modalMode === 'create') {
        await apiClient.post('/courses', {
          name: name.trim(),
          academic_period: academicPeriod.trim() || undefined,
          teacher_id: teacherId,
        });
      } else {
        if (!editingCourse) return;
        await apiClient.put(`/courses/${editingCourse.id}`, {
          name: name.trim(),
          academic_period: academicPeriod.trim() || undefined,
          teacher_id: teacherId,
        });
      }

      await fetchCourses();
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.response?.data?.error ?? 'Error al guardar el curso.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEnroll = (course: Course) => {
    setEnrollTarget(course);
    // Carga los IDs de los estudiantes ya matriculados
    setEnrolledStudentIds((course.students || []).map(s => s.id));
    setSelectedEnrollStudentId('');
  };

  const handleAddStudentToEnroll = () => {
    if (!selectedEnrollStudentId) return;
    if (enrolledStudentIds.includes(selectedEnrollStudentId)) return;
    setEnrolledStudentIds(prev => [...prev, selectedEnrollStudentId]);
    setSelectedEnrollStudentId('');
  };

  const handleRemoveStudentFromEnroll = (studentId: string) => {
    setEnrolledStudentIds(prev => prev.filter(id => id !== studentId));
  };

  const handleSubmitEnroll = async () => {
    if (!enrollTarget) return;
    setEnrollSubmitting(true);
    try {
      await apiClient.put(`/courses/${enrollTarget.id}`, {
        student_ids: enrolledStudentIds,
      });
      await fetchCourses();
      setEnrollTarget(null);
    } catch (err) {
      alert('Error al actualizar la matrícula de estudiantes.');
    } finally {
      setEnrollSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCourse) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/courses/${deletingCourse.id}`);
      await fetchCourses();
      setDeletingCourse(null);
    } catch (err) {
      alert('Error al eliminar el curso.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.teacher?.user?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <span className="nav-logo-dot" />CASPETE GESTIÓN
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            🏠 <span className="desktop-only">Inicio</span>
          </button>
          <button className="btn-ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="dashboard-body">
        {/* Encabezado */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p className="dashboard-label">Ecosistema Académico</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.56px' }}>
              Materias y Cursos
            </h1>
          </div>
          <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={handleOpenCreate}>
            ➕ Crear Nuevo Curso
          </button>
        </div>

        {/* Buscador */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-placeholder)" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="form-input" placeholder="Buscar por materia o docente..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 0, paddingLeft: 40 }} />
          </div>
        </div>

        {loading && <div className="roadmap-note">Cargando materias escolares...</div>}
        {error && <div className="form-error">{error}</div>}

        {!loading && !error && filteredCourses.length === 0 && (
          <div className="roadmap-note" style={{ padding: 40 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>No hay cursos registrados.</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              {search ? 'Intenta buscar con otros términos.' : 'Crea una nueva materia usando el botón de arriba.'}
            </p>
          </div>
        )}

        {!loading && filteredCourses.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredCourses.map((course) => (
              <div key={course.id} className="user-card" style={{ padding: '20px 24px', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>📘 {course.name}</h2>
                      {course.academic_period && (
                        <span className="role-badge" style={{ fontSize: 11, padding: '2px 8px' }}>
                          {course.academic_period}
                        </span>
                      )}
                    </div>

                    <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                      Docente asignado: <strong>{course.teacher?.user?.name ?? 'No asignado'}</strong>
                    </p>

                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      🎒 {(course.students || []).length} Estudiante{(course.students || []).length !== 1 ? 's' : ''} matriculado{(course.students || []).length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 13, padding: '5px 12px', color: 'var(--color-brand-deep)', borderColor: 'rgba(24,226,153,0.3)' }}
                      onClick={() => handleOpenEnroll(course)}
                    >
                      👥 Matricular
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 13, padding: '5px 12px' }}
                      onClick={() => handleOpenEdit(course)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 13, padding: '5px 12px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.2)' }}
                      onClick={() => setDeletingCourse(course)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL CREAR / EDITAR CURSO */}
      {isModalOpen && (
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
          onClick={() => !submitting && setIsModalOpen(false)}
        >
          <div
            className="user-card"
            style={{ maxWidth: 440, width: '100%', padding: '32px 28px', marginBottom: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600 }}>
              {modalMode === 'create' ? 'Crear Nuevo Curso' : 'Modificar Materia / Curso'}
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-text-muted)' }}>
              Registra una asignatura y asígnale un docente responsable
            </p>

            <form onSubmit={handleSubmitCourse}>
              {/* Nombre de la asignatura */}
              <div className="form-group">
                <label className="form-label" htmlFor="course-name">Nombre de la Materia</label>
                <input
                  id="course-name"
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Matemáticas 5°A, Inglés Básico, Ciencias"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Periodo académico */}
              <div className="form-group">
                <label className="form-label" htmlFor="course-period">Periodo Académico (Opcional)</label>
                <input
                  id="course-period"
                  className="form-input"
                  type="text"
                  value={academicPeriod}
                  onChange={(e) => setAcademicPeriod(e.target.value)}
                  placeholder="Ej: Año 2026, Trimestre 1, Semestre 1"
                  disabled={submitting}
                />
              </div>

              {/* Docente */}
              <div className="form-group">
                <label className="form-label" htmlFor="course-teacher">Docente Asignado</label>
                <select
                  id="course-teacher"
                  className="form-select"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">Selecciona un docente...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      👩‍🏫 {t.user.name} ({t.user.email})
                    </option>
                  ))}
                </select>
              </div>

              {modalError && <p className="form-error">{modalError}</p>}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, marginTop: 0 }}
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MATRICULAR ALUMNOS */}
      {enrollTarget && (
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
          onClick={() => !enrollSubmitting && setEnrollTarget(null)}
        >
          <div
            className="user-card"
            style={{ maxWidth: 480, width: '100%', padding: '32px 28px', marginBottom: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600 }}>
              Matricular Estudiantes
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Clase: <strong>{enrollTarget.name}</strong> · Alumnos inscritos: <strong>{enrolledStudentIds.length}</strong>
            </p>

            {/* Selector de nuevo alumno */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <select
                className="form-select"
                value={selectedEnrollStudentId}
                onChange={e => setSelectedEnrollStudentId(e.target.value)}
                style={{ flex: 1, marginBottom: 0 }}
              >
                <option value="">Selecciona un estudiante para matricular...</option>
                {allStudents
                  .filter(s => !enrolledStudentIds.includes(s.id))
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      🎒 {s.full_name} {s.grade ? `(${s.grade})` : ''}
                    </option>
                  ))
                }
              </select>
              <button
                type="button"
                className="btn-ghost"
                style={{ whiteSpace: 'nowrap', color: 'var(--color-brand-deep)', borderColor: 'rgba(24,226,153,0.3)' }}
                onClick={handleAddStudentToEnroll}
                disabled={!selectedEnrollStudentId}
              >
                ➕ Matricular
              </button>
            </div>

            {/* Listado de alumnos matriculados */}
            <p className="dashboard-label" style={{ marginBottom: 8 }}>Estudiantes Inscritos en este curso</p>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 12, padding: 12, background: 'var(--color-gray-50)', minHeight: 180, marginBottom: 20 }}>
              {enrolledStudentIds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  No hay estudiantes inscritos en este curso todavía.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {enrolledStudentIds.map(stId => {
                    const student = allStudents.find(s => s.id === stId);
                    return (
                      <div
                        key={stId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          background: '#fff',
                          fontSize: 13,
                        }}
                      >
                        <span>🎒 <strong>{student?.full_name ?? 'Estudiante'}</strong> {student?.grade ? `(${student.grade})` : ''}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudentFromEnroll(stId)}
                          style={{ border: 'none', background: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '2px 4px', fontSize: 12 }}
                          title="Remover matrícula"
                        >
                          ❌
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setEnrollTarget(null)}
                disabled={enrollSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, marginTop: 0 }}
                onClick={handleSubmitEnroll}
                disabled={enrollSubmitting}
              >
                {enrollSubmitting ? 'Guardando...' : 'Guardar Matrícula'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAR ELIMINACIÓN DE CURSO */}
      {deletingCourse && (
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
          onClick={() => !deleteLoading && setDeletingCourse(null)}
        >
          <div
            className="user-card"
            style={{ maxWidth: 400, width: '100%', padding: '32px 28px', marginBottom: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>⚠️</p>
              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>¿Eliminar materia / curso?</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                ¿Estás seguro de que deseas eliminar permanentemente la materia <strong>"{deletingCourse.name}"</strong>?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--color-error)', fontWeight: 500 }}>
                Esto eliminará las calificaciones y matrículas asociadas a esta clase.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-ghost"
                style={{ flex: 1 }}
                disabled={deleteLoading}
                onClick={() => setDeletingCourse(null)}
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
                  cursor: deleteLoading ? 'wait' : 'pointer',
                  opacity: deleteLoading ? 0.7 : 1,
                }}
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
              >
                {deleteLoading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
