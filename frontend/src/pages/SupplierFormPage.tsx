import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface SupplierForm {
  name: string; nit: string; contact_name: string; contact_phone: string;
  contact_email: string; city: string; tech_sheet_url: string; is_verified: boolean;
}

const EMPTY: SupplierForm = { name: '', nit: '', contact_name: '', contact_phone: '', contact_email: '', city: '', tech_sheet_url: '', is_verified: false };

export default function SupplierFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [form, setForm] = useState<SupplierForm>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    apiClient.get<{ data: SupplierForm & { id: string } }>(`/suppliers/${id}`)
      .then(r => {
        const s = r.data.data;
        setForm({
          name: s.name ?? '', nit: s.nit ?? '', contact_name: s.contact_name ?? '',
          contact_phone: (s.contact_phone ?? '').replace(/^\+57/, ''), contact_email: s.contact_email ?? '',
          city: s.city ?? '', tech_sheet_url: s.tech_sheet_url ?? '', is_verified: s.is_verified,
        });
      })
      .catch(() => setError('No se pudo cargar el proveedor'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(field: keyof SupplierForm, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre del proveedor es requerido'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        nit: form.nit.trim() || null,
        contact_name: form.contact_name.trim() || null,
        contact_phone: form.contact_phone.trim() ? `+57${form.contact_phone.trim()}` : null,
        contact_email: form.contact_email.trim() || null,
        city: form.city.trim() || null,
        tech_sheet_url: form.tech_sheet_url.trim() || null,
        is_verified: form.is_verified,
        ...(form.tech_sheet_url.trim() && !isEdit ? { tech_sheet_uploaded_at: new Date().toISOString() } : {}),
      };
      if (isEdit) {
        await apiClient.patch(`/suppliers/${id}`, payload);
      } else {
        await apiClient.post('/suppliers', payload);
      }
      navigate('/suppliers');
    } catch (e) {
      setError((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al guardar');
    } finally { setSaving(false); }
  }

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/suppliers')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Proveedores
          </button>
          <button className="btn-ghost" onClick={logout}>Salir</button>
        </div>
      </nav>

      <main className="dashboard-body" style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 24 }}>
          <p className="dashboard-label">Ley 2120 — Art. 32 Res. 2492</p>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>
            {isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h1>
        </div>

        {loading ? (
          <div className="roadmap-note">Cargando datos del proveedor...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Información básica */}
            <div className="user-card" style={{ padding: '20px 24px', marginBottom: 16 }}>
              <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)' }}>Información básica</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nombre del proveedor *</label>
                  <input className="form-input" placeholder="Ej: Distribuidora Alimentos S.A.S" value={form.name} onChange={e => handleChange('name', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">NIT</label>
                  <input className="form-input" placeholder="900.123.456-7" value={form.nit} onChange={e => handleChange('nit', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Ciudad</label>
                  <input className="form-input" placeholder="Medellín" value={form.city} onChange={e => handleChange('city', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="user-card" style={{ padding: '20px 24px', marginBottom: 16 }}>
              <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)' }}>Contacto</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Nombre de contacto</label>
                  <input className="form-input" placeholder="Juan García" value={form.contact_name} onChange={e => handleChange('contact_name', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Teléfono <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(opc.)</span></label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', userSelect: 'none' }}>🇨🇴 +57</span>
                    <input
                      className="form-input"
                      type="tel"
                      placeholder="300 123 4567"
                      value={form.contact_phone}
                      onChange={e => handleChange('contact_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      style={{ flex: 1, marginBottom: 0 }}
                    />
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Correo electrónico</label>
                  <input className="form-input" type="email" placeholder="contacto@proveedor.com" value={form.contact_email} onChange={e => handleChange('contact_email', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Ficha técnica — Ley 2120 */}
            <div className="user-card" style={{ padding: '20px 24px', marginBottom: 16, border: '1.5px solid rgba(0,0,0,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <svg width={18} height={18} viewBox="0 0 100 100"><polygon points="30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30" fill="var(--color-text)" /></svg>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)' }}>Ficha técnica — Art. 32 Res. 2492</p>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#1d4ed8', lineHeight: 1.5 }}>
                  La Resolución 2492 de 2022 exige ficha técnica del proveedor vigente (máx. 12 meses) para todos los productos con etiquetado de advertencia. Sin esta ficha el proveedor no puede ser verificado.
                </p>
              </div>
              <label className="form-label">URL de la ficha técnica</label>
              <input className="form-input" type="url" placeholder="https://drive.google.com/..." value={form.tech_sheet_url} onChange={e => handleChange('tech_sheet_url', e.target.value)} />
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>Al guardar con una URL, la fecha de carga se actualizará automáticamente.</p>

              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="is_verified" checked={form.is_verified} onChange={e => handleChange('is_verified', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="is_verified" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  Marcar como proveedor verificado
                  <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>(requiere ficha técnica vigente)</span>
                </label>
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => navigate('/suppliers')} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={saving}>
                {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear proveedor'}
              </button>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
