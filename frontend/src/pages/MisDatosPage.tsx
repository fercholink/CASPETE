import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

export default function MisDatosPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [myData, setMyData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [toggleSaving, setToggleSaving] = useState(false);
  const [toggleMsg, setToggleMsg] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');

  useEffect(() => {
    apiClient.get<{ data: Record<string, unknown> }>('/arco/my-data')
      .then(r => {
        setMyData(r.data.data);
        const d = r.data.data as { allow_analytics?: boolean; allow_marketing?: boolean };
        setAnalytics(d.allow_analytics ?? true);
        setMarketing(d.allow_marketing ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveToggles() {
    setToggleSaving(true); setToggleMsg('');
    try {
      await apiClient.patch('/arco/privacy-toggles', { allow_analytics: analytics, allow_marketing: marketing });
      setToggleMsg('Preferencias guardadas correctamente.');
    } catch { setToggleMsg('Error al guardar.'); }
    finally { setToggleSaving(false); }
  }

  async function requestDelete() {
    setDeleteLoading(true);
    try {
      await apiClient.post('/arco/request-deletion', { reason: deleteReason || 'Solicitud del titular' });
      setDeleteMsg('Solicitud registrada. Sus datos serán anonimizados en 30 días. Recibirá una confirmación.');
      setDeleteModal(false);
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
      setDeleteMsg(msg ?? 'Error al registrar la solicitud.');
    } finally { setDeleteLoading(false); }
  }

  function downloadData() {
    if (!myData) return;
    const blob = new Blob([JSON.stringify(myData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mis-datos-caspete-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Inicio
          </button>
          <button className="btn-ghost" onClick={logout}>Salir</button>
        </div>
      </nav>

      <main className="dashboard-body" style={{ maxWidth: 660 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p className="dashboard-label">Ley 1581 de 2012 — Derechos ARCO</p>
          <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>
            Mis datos personales
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            La Ley 1581 de 2012 le otorga el derecho a conocer, actualizar, rectificar y suprimir
            sus datos personales y los de su(s) hijo(s). Ejerce esos derechos aquí.
          </p>
        </div>

        {/* 1. Ver y descargar datos (Derecho de Acceso) */}
        <div className="user-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>📋 Acceso a mis datos</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>Art. 13 — Derecho de Acceso</p>
            </div>
            <button className="btn-primary" onClick={downloadData} disabled={!myData} style={{ fontSize: 13, padding: '8px 16px' }}>
              ⬇ Descargar JSON
            </button>
          </div>
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando datos...</p>
          ) : myData ? (
            <div style={{ background: 'var(--color-gray-50, #f9fafb)', borderRadius: 8, padding: '12px 14px', fontSize: 12, fontFamily: 'var(--font-mono, monospace)', overflowX: 'auto', maxHeight: 220, overflow: 'auto', border: '1px solid var(--color-border)' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13 }}>Datos almacenados:</p>
              <p style={{ margin: '0 0 2px' }}>📧 {user?.email}</p>
              <p style={{ margin: '0 0 2px' }}>👤 {user?.full_name}</p>
              <p style={{ margin: '0 0 2px' }}>📱 {user?.phone ?? '(sin teléfono)'}</p>
              <p style={{ margin: '0 0 2px' }}>🏫 Rol: {user?.role}</p>
              <p style={{ margin: '0 0 4px', marginTop: 8, fontWeight: 600 }}>Hijos registrados:</p>
              {((myData as { students?: { full_name: string; grade?: string | null }[] }).students ?? []).map((s, i) => (
                <p key={i} style={{ margin: '0 0 2px' }}>👦 {s.full_name} {s.grade ? `— Grado ${s.grade}` : ''}</p>
              ))}
            </div>
          ) : (
            <p className="form-error">Error al cargar datos</p>
          )}
        </div>

        {/* 2. Oposición granular */}
        <div className="user-card" style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15 }}>⚙️ Control de tratamiento</p>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--color-text-muted)' }}>Art. 13 lit. c — Derecho de Oposición</p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--color-gray-50, #f9fafb)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>📊 Análisis de uso</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>Usamos datos anónimos para mejorar el servicio.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{analytics ? '✅ Activo' : '❌ Inactivo'}</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '10px 12px', borderRadius: 8, background: 'var(--color-gray-50, #f9fafb)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>📣 Comunicaciones comerciales</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>Promociones y novedades de Caspete.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{marketing ? '✅ Activo' : '❌ Inactivo'}</span>
            </label>
          </div>

          {toggleMsg && <p style={{ fontSize: 13, color: '#16a34a', marginBottom: 8 }}>✓ {toggleMsg}</p>}
          <button className="btn-primary" onClick={saveToggles} disabled={toggleSaving} style={{ fontSize: 13 }}>
            {toggleSaving ? 'Guardando...' : 'Guardar preferencias'}
          </button>
        </div>

        {/* 3. Derecho al olvido */}
        <div className="user-card" style={{ border: '1.5px solid rgba(239,68,68,0.3)', marginBottom: 16 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: '#dc2626' }}>🗑️ Eliminar mi cuenta y datos</p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-text-muted)' }}>Art. 8 / Art. 15 — Derecho al Olvido · Plazo: 30 días de gracia</p>
          <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6 }}>
            Al solicitar la eliminación, sus datos y los de sus hijos serán anonimizados en 30 días.
            Recibirá confirmación por correo. Puede cancelar la solicitud durante ese período.
          </p>
          {deleteMsg && <p className="form-error" style={{ marginBottom: 10 }}>{deleteMsg}</p>}
          <button
            onClick={() => setDeleteModal(true)}
            style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Solicitar eliminación de mis datos
          </button>
        </div>

        {/* 4. Canal de contacto */}
        <div className="user-card" style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.15)' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#1d4ed8' }}>📮 Canal oficial de derechos</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Para ejercer derechos de <strong>Rectificación</strong> de datos sensibles o consultas legales, escríbenos a{' '}
            <a href="mailto:privacidad@caspete.com" style={{ color: '#1d4ed8', fontWeight: 600 }}>privacidad@caspete.com</a>.
            Plazo de respuesta: máximo 15 días hábiles (Art. 14 Ley 1581/2012).
          </p>
        </div>
      </main>

      {/* Modal confirmación eliminación */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="user-card" style={{ maxWidth: 460, width: '100%', padding: 28 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: '#dc2626' }}>⚠️ Confirmar eliminación</h2>
            <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
              Esta acción eliminará <strong>permanentemente</strong> sus datos y los de sus hijos tras 30 días.
              ¿Por qué desea eliminar su cuenta?
            </p>
            <textarea
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              placeholder="Motivo (opcional)"
              rows={3}
              className="form-input"
              style={{ resize: 'vertical', marginBottom: 16, width: '100%', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setDeleteModal(false)} style={{ flex: 1 }}>Cancelar</button>
              <button
                onClick={requestDelete}
                disabled={deleteLoading}
                style={{ flex: 2, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                {deleteLoading ? 'Procesando...' : 'Sí, solicitar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
