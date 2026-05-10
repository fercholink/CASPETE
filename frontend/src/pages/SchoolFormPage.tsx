import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface SchoolData {
  id: string;
  name: string;
  nit: string | null;
  city: string;
  department: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
  active: boolean;
}

const DEPARTMENTS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas','Caquetá',
  'Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca','Guainía','Guaviare',
  'Huila','La Guajira','Magdalena','Meta','Nariño','Norte de Santander','Putumayo',
  'Quindío','Risaralda','San Andrés y Providencia','Santander','Sucre','Tolima',
  'Valle del Cauca','Vaupés','Vichada','Bogotá D.C.',
];

const emptyForm = {
  name: '', nit: '', city: '', department: '', address: '',
  phone: '', email: '', logo_url: '', plan: 'BASIC' as const,
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
    apiClient.get<{ data: SchoolData }>(`/schools/${id}`)
      .then(res => {
        const s = res.data.data;
        setForm({
          name: s.name, nit: s.nit ?? '', city: s.city,
          department: s.department ?? '', address: s.address ?? '',
          phone: s.phone ?? '', email: s.email ?? '',
          logo_url: s.logo_url ?? '', plan: s.plan as typeof emptyForm.plan,
        });
      })
      .catch(() => setError('No se pudo cargar el colegio'))
      .finally(() => setFetching(false));
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      name: form.name, city: form.city, plan: form.plan,
      ...(form.nit ? { nit: form.nit } : {}),
      ...(form.department ? { department: form.department } : {}),
      ...(form.address ? { address: form.address } : {}),
      ...(form.phone ? { phone: form.phone } : {}),
      ...(form.email ? { email: form.email } : {}),
      ...(form.logo_url ? { logo_url: form.logo_url } : {}),
    };
    try {
      if (isEdit) await apiClient.patch(`/schools/${id}`, payload);
      else await apiClient.post('/schools', payload);
      navigate('/schools');
    } catch (err: unknown) {
      setError((err as any).response?.data?.error ?? 'Error al guardar el colegio');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="auth-page">
        <div className="roadmap-note" style={{ maxWidth: 440, width: '100%' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ justifyContent: 'flex-start', paddingTop: 48 }}>
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <Link to="/schools" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 24 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a colegios
        </Link>

        <span className="brand-badge"><span className="brand-dot" />CASPETE</span>
        <h1 className="auth-title">{isEdit ? 'Editar colegio' : 'Nuevo colegio'}</h1>
        <p className="auth-subtitle">{isEdit ? 'Actualiza los datos del colegio' : 'Registra un nuevo colegio en la plataforma'}</p>

        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">Nombre del colegio</label>
            <input id="name" name="name" className="form-input" type="text" value={form.name} onChange={handleChange} required placeholder="Colegio San José" />
          </div>

          {/* Ciudad + Departamento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="city">Ciudad</label>
              <input id="city" name="city" className="form-input" type="text" value={form.city} onChange={handleChange} required placeholder="Bogotá" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="department">Departamento</label>
              <select id="department" name="department" className="form-select" value={form.department} onChange={handleChange}>
                <option value="">Seleccionar...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* NIT + Plan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="nit">
                NIT <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>(opcional)</span>
              </label>
              <input id="nit" name="nit" className="form-input" type="text" value={form.nit} onChange={handleChange} placeholder="900123456-1" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="plan">Plan</label>
              <select id="plan" name="plan" className="form-select" value={form.plan} onChange={handleChange}>
                <option value="BASIC">⚡ Básico</option>
                <option value="STANDARD">⭐ Estándar</option>
                <option value="PREMIUM">👑 Premium</option>
              </select>
            </div>
          </div>

          {/* Dirección */}
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label" htmlFor="address">
              Dirección <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <input id="address" name="address" className="form-input" type="text" value={form.address} onChange={handleChange} placeholder="Cra 7 # 32-16" />
          </div>

          {/* Contacto */}
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, marginTop: 20, fontWeight: 600 }}>Información de contacto</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="phone">Teléfono</label>
              <input id="phone" name="phone" className="form-input" type="tel" value={form.phone} onChange={handleChange} placeholder="+57 300 123 4567" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="email">Correo</label>
              <input id="email" name="email" className="form-input" type="email" value={form.email} onChange={handleChange} placeholder="contacto@colegio.edu.co" />
            </div>
          </div>

          {/* Logo */}
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label" htmlFor="logo_url">
              URL del logo <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <input id="logo_url" name="logo_url" className="form-input" type="url" value={form.logo_url} onChange={handleChange} placeholder="https://..." />
            {form.logo_url && (
              <div style={{ marginTop: 8 }}>
                <img src={form.logo_url} alt="Preview" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--color-border)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (isEdit ? 'Guardando...' : 'Creando...') : (isEdit ? 'Guardar cambios' : 'Crear colegio')}
          </button>
        </form>
      </div>
    </div>
  );
}
