import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface Supplier {
  id: string; name: string; nit: string | null; contact_name: string | null;
  contact_phone: string | null; contact_email: string | null; city: string | null;
  tech_sheet_url: string | null; tech_sheet_uploaded_at: string | null;
  is_verified: boolean; active: boolean; created_at: string;
}
interface SuppliersResponse { suppliers: Supplier[]; total: number; page: number; pages: number; }

const TECH_SHEET_MAX_DAYS = 365;

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function techSheetStatus(s: Supplier): { label: string; color: string; bg: string; urgent: boolean } {
  if (!s.tech_sheet_url) return { label: 'Sin ficha', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', urgent: true };
  const days = daysSince(s.tech_sheet_uploaded_at);
  if (days === null) return { label: 'Sin fecha', color: '#ca8a04', bg: 'rgba(202,138,4,0.08)', urgent: true };
  if (days >= TECH_SHEET_MAX_DAYS) return { label: `Vencida (${days}d)`, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', urgent: true };
  if (days >= 300) return { label: `Por vencer (${TECH_SHEET_MAX_DAYS - days}d)`, color: '#ca8a04', bg: 'rgba(202,138,4,0.08)', urgent: false };
  return { label: `Vigente (${days}d)`, color: '#15803d', bg: 'rgba(22,163,74,0.08)', urgent: false };
}

export default function SuppliersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const expiredOnly = params.get('expired_only') === 'true';

  const [data, setData] = useState<SuppliersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isSA = user?.role === 'SUPER_ADMIN';

  const fetchSuppliers = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set('limit', '100');
    if (expiredOnly) p.set('expired_only', 'true');
    apiClient.get<{ data: SuppliersResponse }>(`/suppliers?${p}`)
      .then(r => { setData(r.data.data); setError(''); })
      .catch(e => setError(e?.response?.data?.error ?? 'Error al cargar proveedores'))
      .finally(() => setLoading(false));
  }, [expiredOnly]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const filtered = (data?.suppliers ?? []).filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase()) ||
    s.nit?.includes(search)
  );

  const expiredCount = (data?.suppliers ?? []).filter(s => techSheetStatus(s).urgent).length;

  async function handleToggleVerify(s: Supplier) {
    try {
      await apiClient.patch(`/suppliers/${s.id}`, { is_verified: !s.is_verified });
      fetchSuppliers();
    } catch { setError('Error al actualizar'); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/suppliers/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchSuppliers();
    } catch (e) {
      setError((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al eliminar');
    } finally { setDeleting(false); }
  }

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="desktop-only">Inicio</span>
          </button>
          <Link to="/ley2120" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>⬛ Ley 2120</Link>
          <button className="btn-ghost" onClick={logout}>Salir</button>
        </div>
      </nav>

      <main className="dashboard-body">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <p className="dashboard-label">Ley 2120 — Art. 32 Res. 2492</p>
            <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>Proveedores</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>
              Trazabilidad de proveedores y fichas técnicas
              {data && <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}>· {data.total} total</span>}
            </p>
          </div>
          {isSA && (
            <Link to="/suppliers/new" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo proveedor
            </Link>
          )}
        </div>

        {/* Alerta fichas vencidas */}
        {expiredCount > 0 && (
          <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(220,38,38,0.06)', border: '1.5px solid rgba(220,38,38,0.25)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#dc2626' }}>{expiredCount} proveedor{expiredCount !== 1 ? 'es' : ''} con fichas vencidas o sin ficha técnica</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7f1d1d' }}>Resolución 2492 requiere fichas técnicas vigentes (&lt;12 meses). Riesgo de incumplimiento.</p>
            </div>
            <button className="btn-ghost" style={{ fontSize: 12, color: '#dc2626', border: '1px solid rgba(220,38,38,0.3)', whiteSpace: 'nowrap' }}
              onClick={() => setParams(expiredOnly ? {} : { expired_only: 'true' })}>
              {expiredOnly ? 'Ver todos' : 'Ver urgentes'}
            </button>
          </div>
        )}

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="form-input" placeholder="Buscar proveedor, ciudad o NIT..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 0, paddingLeft: 40 }} />
          </div>
          <button className={expiredOnly ? 'btn-primary' : 'btn-ghost'} style={{ fontSize: 13, padding: '8px 14px', whiteSpace: 'nowrap' }}
            onClick={() => setParams(expiredOnly ? {} : { expired_only: 'true' })}>
            ⚠️ Solo urgentes {expiredCount > 0 && `(${expiredCount})`}
          </button>
          {(search || expiredOnly) && (
            <button className="btn-ghost" style={{ fontSize: 13, color: 'var(--color-text-muted)' }} onClick={() => { setSearch(''); setParams({}); }}>Limpiar ×</button>
          )}
        </div>

        {/* Error */}
        {error && <p className="form-error">{error}</p>}

        {/* Loading */}
        {loading && <div className="roadmap-note">Cargando proveedores...</div>}

        {/* Tabla */}
        {!loading && filtered.length === 0 && (
          <div className="roadmap-note" style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 8px', fontSize: 20 }}>🏭</p>
            <p style={{ margin: 0, fontSize: 14 }}>No hay proveedores registrados aún.</p>
            {isSA && <Link to="/suppliers/new" className="btn-primary" style={{ display: 'inline-block', marginTop: 12, textDecoration: 'none', fontSize: 13 }}>Agregar primer proveedor</Link>}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(s => {
              const status = techSheetStatus(s);
              return (
                <div key={s.id} className="user-card" style={{ padding: '16px 20px', marginBottom: 0, borderLeft: status.urgent ? '3px solid #dc2626' : '3px solid transparent', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    {/* Info principal */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</span>
                        {s.is_verified && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(22,163,74,0.1)', color: '#15803d', fontWeight: 600 }}>✓ Verificado</span>}
                        {!s.active && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(220,38,38,0.1)', color: '#dc2626', fontWeight: 600 }}>Inactivo</span>}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                        {s.nit && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>NIT: {s.nit}</span>}
                        {s.city && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>📍 {s.city}</span>}
                        {s.contact_name && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>👤 {s.contact_name}</span>}
                        {s.contact_email && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>✉️ {s.contact_email}</span>}
                        {s.contact_phone && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>📞 {s.contact_phone}</span>}
                      </div>
                    </div>

                    {/* Estado ficha técnica */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: status.bg, color: status.color, fontWeight: 600 }}>
                        📄 {status.label}
                      </span>
                      {s.tech_sheet_url && (
                        <a href={s.tech_sheet_url} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, color: 'var(--color-brand-deep)', textDecoration: 'underline' }}>
                          Ver ficha técnica ↗
                        </a>
                      )}
                    </div>

                    {/* Acciones */}
                    {isSA && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignSelf: 'center' }}>
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px', color: s.is_verified ? '#ca8a04' : '#15803d' }}
                          onClick={() => handleToggleVerify(s)}
                          title={s.is_verified ? 'Quitar verificación' : 'Marcar como verificado'}>
                          {s.is_verified ? '✗ Desverificar' : '✓ Verificar'}
                        </button>
                        <Link to={`/suppliers/${s.id}/edit`} className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px', textDecoration: 'none' }}>✏️</Link>
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px', color: '#dc2626' }} onClick={() => setDeleteTarget(s)}>🗑</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal eliminar */}
        {deleteTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div className="auth-card" style={{ maxWidth: 380, width: '100%', margin: 0 }}>
              <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>¿Eliminar proveedor?</p>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-text-muted)' }}>Se eliminará <strong>{deleteTarget.name}</strong> permanentemente.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</button>
                <button className="btn-primary" style={{ flex: 1, background: '#dc2626', borderColor: '#dc2626' }} onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
