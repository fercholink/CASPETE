import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface PaymentField { label: string; value: string }
interface PaymentMethod {
  id: string; key: string; label: string; icon: string; color: string;
  fields: PaymentField[]; active: boolean; sort_order: number;
}

export default function PaymentMethodsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [editTarget, setEditTarget] = useState<PaymentMethod | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editFields, setEditFields] = useState<PaymentField[]>([]);
  const [editActive, setEditActive] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { fetchMethods(); }, []);

  async function fetchMethods() {
    setLoading(true);
    try {
      const r = await apiClient.get<{ data: PaymentMethod[] }>('/payment-methods/all');
      setMethods(r.data.data);
    } catch {} finally { setLoading(false); }
  }

  function openEdit(pm: PaymentMethod) {
    setEditTarget(pm);
    setEditLabel(pm.label);
    setEditIcon(pm.icon);
    setEditColor(pm.color);
    setEditFields([...pm.fields]);
    setEditActive(pm.active);
    setSaveError('');
  }

  function closeEdit() { setEditTarget(null); setSaveError(''); }

  function updateField(idx: number, key: 'label' | 'value', val: string) {
    setEditFields(f => f.map((ff, i) => i === idx ? { ...ff, [key]: val } : ff));
  }

  function addField() { setEditFields(f => [...f, { label: '', value: '' }]); }
  function removeField(idx: number) { setEditFields(f => f.filter((_, i) => i !== idx)); }

  async function handleSave() {
    if (!editTarget) return;
    setSaveLoading(true); setSaveError('');
    try {
      await apiClient.put(`/payment-methods/${editTarget.id}`, {
        label: editLabel, icon: editIcon, color: editColor,
        fields: editFields.filter(f => f.label && f.value),
        active: editActive,
      });
      closeEdit();
      fetchMethods();
    } catch (e: any) {
      setSaveError(e?.response?.data?.error ?? 'Error al guardar');
    } finally { setSaveLoading(false); }
  }

  if (user?.role !== 'SUPER_ADMIN') {
    return <div className="auth-page"><p className="form-error">Acceso denegado</p></div>;
  }

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="desktop-only">Inicio</span>
          </button>
          <button className="btn-ghost" onClick={logout}>
            <span className="desktop-only">Cerrar sesión</span>
            <span className="mobile-only">Salir</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-body">
        <div style={{ marginBottom: 24 }}>
          <p className="dashboard-label">Configuración</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Métodos de Pago</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
            Estos datos aparecen cuando un padre va a recargar saldo.
          </p>
        </div>

        {loading && <div className="roadmap-note">Cargando...</div>}

        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {methods.map(pm => (
              <div key={pm.id} className="user-card" style={{ padding: '20px', marginBottom: 0, opacity: pm.active ? 1 : 0.5, borderLeft: `4px solid ${pm.color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 28 }}>{pm.icon}</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: pm.color }}>{pm.label}</h3>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span className="role-badge" style={{ fontSize: 10, background: pm.active ? 'var(--color-brand-light)' : 'rgba(220,38,38,0.1)', color: pm.active ? 'var(--color-brand-deep)' : '#dc2626' }}>
                            {pm.active ? 'Activo' : 'Desactivado'}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>KEY: {pm.key}</span>
                        </div>
                      </div>
                    </div>

                    {/* Fields preview */}
                    <div style={{ background: `${pm.color}08`, borderRadius: 8, padding: '10px 14px' }}>
                      {(pm.fields as PaymentField[]).map((f, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13 }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>{f.label}</span>
                          <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0 }} onClick={() => openEdit(pm)}>
                    ✏️ Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit modal */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={() => !saveLoading && closeEdit()}>
          <div className="user-card" style={{ maxWidth: 520, width: '100%', padding: '32px 28px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Editar {editTarget.label}</h2>
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 18, lineHeight: 1 }} onClick={closeEdit}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nombre</label>
                <input className="form-input" value={editLabel} onChange={e => setEditLabel(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Icono (emoji)</label>
                <input className="form-input" value={editIcon} onChange={e => setEditIcon(e.target.value)} maxLength={4} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} style={{ width: 36, height: 36, padding: 0, border: 'none', cursor: 'pointer' }} />
                  <input className="form-input" value={editColor} onChange={e => setEditColor(e.target.value)} style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13 }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  Activo (visible para padres)
                </label>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>Datos de la cuenta</label>
                <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={addField}>+ Campo</button>
              </div>
              {editFields.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input className="form-input" placeholder="Ej: Número de cuenta" value={f.label}
                    onChange={e => updateField(i, 'label', e.target.value)} style={{ flex: 1, marginBottom: 0 }} />
                  <input className="form-input" placeholder="Ej: 000-000000-00" value={f.value}
                    onChange={e => updateField(i, 'value', e.target.value)} style={{ flex: 1, marginBottom: 0, fontFamily: 'var(--font-mono)' }} />
                  <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 14, color: '#dc2626', flexShrink: 0 }} onClick={() => removeField(i)}>✕</button>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div style={{ background: `${editColor}08`, border: `1.5px solid ${editColor}25`, borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>VISTA PREVIA</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{editIcon}</span>
                <span style={{ fontWeight: 700, color: editColor }}>{editLabel}</span>
              </div>
              {editFields.filter(f => f.label && f.value).map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{f.label}</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{f.value}</span>
                </div>
              ))}
            </div>

            {saveError && <p className="form-error" style={{ marginBottom: 12 }}>{saveError}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={saveLoading} onClick={closeEdit}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1 }} disabled={saveLoading} onClick={handleSave}>
                {saveLoading ? 'Guardando...' : '💾 Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
