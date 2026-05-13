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
  country_code: string | null;
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
  phone: '', country_code: '+57', email: '', logo_url: '', plan: 'BASIC' as const,
};

export default function SchoolFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');
  const [logoMode, setLogoMode] = useState<'url' | 'file'>('url');
  const [logoPreview, setLogoPreview] = useState<string>('');

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('El logo no puede superar 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setForm(p => ({ ...p, logo_url: base64 }));
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (!id) return;
    apiClient.get<{ data: SchoolData }>(`/schools/${id}`)
      .then(res => {
        const s = res.data.data;
        setForm({
          name: s.name, nit: s.nit ?? '', city: s.city,
          department: s.department ?? '', address: s.address ?? '',
          phone: s.phone ?? '', country_code: s.country_code ?? '+57', email: s.email ?? '',
          logo_url: s.logo_url ?? '', plan: s.plan as typeof emptyForm.plan,
        });
      })
      .catch(() => setError('No se pudo cargar el colegio'))
      .finally(() => {
        setFetching(false);
        // Si ya tiene logo, detectar si es base64 o URL
        if (id) setLogoPreview('');
      });
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
      ...(form.phone ? { phone: form.phone.replace(/\s/g, '') } : {}),
      country_code: form.country_code,
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
                <option value="BASIC">⚡ Plan Mensual</option>
                <option value="STANDARD">⭐ Plan Comisión</option>
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
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', userSelect: 'none' }}>🇨🇴 +57</span>
                <input id="phone" name="phone" className="form-input" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="3001234567" style={{ flex: 1, marginBottom: 0 }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="email">Correo</label>
              <input id="email" name="email" className="form-input" type="email" value={form.email} onChange={handleChange} placeholder="contacto@colegio.edu.co" />
            </div>
          </div>

          {/* Logo */}
          <div className="form-group" style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Logo del colegio <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>(opcional)</span>
              </label>
              <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 3 }}>
                <button type="button" onClick={() => { setLogoMode('file'); }} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: logoMode === 'file' ? 'var(--color-brand-deep)' : 'transparent', color: logoMode === 'file' ? '#fff' : 'var(--color-text-muted)', fontWeight: 600, transition: 'all 0.15s' }}>📁 Archivo</button>
                <button type="button" onClick={() => { setLogoMode('url'); }} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: logoMode === 'url' ? 'var(--color-brand-deep)' : 'transparent', color: logoMode === 'url' ? '#fff' : 'var(--color-text-muted)', fontWeight: 600, transition: 'all 0.15s' }}>🔗 URL</button>
              </div>
            </div>

            {logoMode === 'file' ? (
              <div
                style={{ border: '2px dashed var(--color-border)', borderRadius: 12, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-brand-deep)'; }}
                onDragLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'; }}
                onDrop={e => {
                  e.preventDefault();
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleLogoFile({ target: { files: e.dataTransfer.files } } as any);
                }}
                onClick={() => document.getElementById('logo-file-input')?.click()}
              >
                {(logoPreview || form.logo_url) ? (
                  <img src={logoPreview || form.logo_url} alt="Logo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--color-border)', marginBottom: 8 }} />
                ) : (
                  <div style={{ fontSize: 36, marginBottom: 6 }}>🏫</div>
                )}
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {(logoPreview || form.logo_url) ? 'Haz clic para cambiar la imagen' : 'Arrastra una imagen o haz clic para seleccionar'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-placeholder)' }}>PNG, JPG, WEBP · máx. 2 MB</p>
                <input id="logo-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoFile} />
              </div>
            ) : (
              <>
                <input id="logo_url" name="logo_url" className="form-input" type="url" value={form.logo_url} onChange={e => { handleChange(e); setLogoPreview(''); }} placeholder="https://ejemplo.com/logo.png" />
                {form.logo_url && (
                  <div style={{ marginTop: 8 }}>
                    <img src={form.logo_url} alt="Preview" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--color-border)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </>
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
