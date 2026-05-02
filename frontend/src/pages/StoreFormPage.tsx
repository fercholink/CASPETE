import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface School { id: string; name: string; city: string }
interface Store { id: string; name: string; active: boolean; school: School }

export default function StoreFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [name, setName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSuperAdmin) {
      apiClient.get<{ data: School[] }>('/schools/active').then((r) => setSchools(r.data.data));
    }
    if (isEdit && id) {
      apiClient
        .get<{ data: Store }>(`/stores/${id}`)
        .then((r) => {
          setName(r.data.data.name);
          setSchoolId(r.data.data.school.id);
        })
        .catch(() => setError('No se pudo cargar la tienda'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, isSuperAdmin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (isEdit && id) {
        await apiClient.patch(`/stores/${id}`, { name });
      } else {
        await apiClient.post('/stores', {
          name,
          ...(isSuperAdmin && schoolId ? { school_id: schoolId } : {}),
        });
      }
      navigate('/stores');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="auth-page"><div className="roadmap-note" style={{ maxWidth: 480, width: '100%' }}>Cargando...</div></div>;

  return (
    <div className="auth-page" style={{ justifyContent: 'flex-start', paddingTop: 40, alignItems: 'stretch', padding: '40px 24px' }}>
      <div style={{ maxWidth: 480, width: '100%', margin: '0 auto' }}>
        <Link to="/stores" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 24 }}>
          ← Volver a tiendas
        </Link>

        <span className="brand-badge"><span className="brand-dot" />CASPETE</span>
        <h1 className="auth-title">{isEdit ? 'Editar tienda' : 'Nueva tienda'}</h1>

        <form onSubmit={handleSubmit}>
          {isSuperAdmin && !isEdit && (
            <div className="form-group">
              <label className="form-label" htmlFor="school">Colegio</label>
              <select id="school" className="form-select" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} required>
                <option value="">Selecciona un colegio...</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="name">Nombre de la tienda</label>
            <input
              id="name" className="form-input" type="text"
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Tienda Central, Cafetería Principal..."
              required minLength={2} maxLength={200}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear tienda'}
          </button>
        </form>
      </div>
    </div>
  );
}
