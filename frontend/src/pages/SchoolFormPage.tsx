import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface SchoolData {
  id: string;
  name: string;
  nit: string | null;
  city: string;
  address: string | null;
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
  active: boolean;
}

const emptyForm: {
  name: string;
  nit: string;
  city: string;
  address: string;
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
} = {
  name: '',
  nit: '',
  city: '',
  address: '',
  plan: 'BASIC',
};

export default function SchoolFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiClient
      .get<{ data: SchoolData }>(`/schools/${id}`)
      .then((res) => {
        const s = res.data.data;
        setForm({
          name: s.name,
          nit: s.nit ?? '',
          city: s.city,
          address: s.address ?? '',
          plan: s.plan,
        });
      })
      .catch(() => setError('No se pudo cargar el colegio'))
      .finally(() => setFetching(false));
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      name: form.name,
      city: form.city,
      plan: form.plan,
      ...(form.nit ? { nit: form.nit } : {}),
      ...(form.address ? { address: form.address } : {}),
    };
    try {
      if (isEdit) {
        await apiClient.patch(`/schools/${id}`, payload);
      } else {
        await apiClient.post('/schools', payload);
      }
      navigate('/schools');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? 'Error al guardar el colegio';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="auth-page">
        <div className="roadmap-note" style={{ maxWidth: 440, width: '100%' }}>
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ justifyContent: 'flex-start', paddingTop: 48 }}>
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <Link
          to="/schools"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a colegios
        </Link>

        <span className="brand-badge">
          <span className="brand-dot" />
          CASPETE
        </span>

        <h1 className="auth-title">
          {isEdit ? 'Editar colegio' : 'Nuevo colegio'}
        </h1>
        <p className="auth-subtitle">
          {isEdit
            ? 'Actualiza los datos del colegio'
            : 'Registra un nuevo colegio en la plataforma'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Nombre del colegio
            </label>
            <input
              id="name"
              name="name"
              className="form-input"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Colegio San José"
            />
          </div>

          <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="city">
                Ciudad
              </label>
              <input
                id="city"
                name="city"
                className="form-input"
                type="text"
                value={form.city}
                onChange={handleChange}
                required
                placeholder="Bogotá"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="nit">
                NIT{' '}
                <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>
                  (opcional)
                </span>
              </label>
              <input
                id="nit"
                name="nit"
                className="form-input"
                type="text"
                value={form.nit}
                onChange={handleChange}
                placeholder="900123456-1"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label" htmlFor="address">
              Dirección{' '}
              <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>
                (opcional)
              </span>
            </label>
            <input
              id="address"
              name="address"
              className="form-input"
              type="text"
              value={form.address}
              onChange={handleChange}
              placeholder="Cra 7 # 32-16"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="plan">
              Plan
            </label>
            <select
              id="plan"
              name="plan"
              className="form-select"
              value={form.plan}
              onChange={handleChange}
            >
              <option value="BASIC">Básico</option>
              <option value="STANDARD">Estándar</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? isEdit
                ? 'Guardando...'
                : 'Creando...'
              : isEdit
                ? 'Guardar cambios'
                : 'Crear colegio'}
          </button>
        </form>
      </div>
    </div>
  );
}
