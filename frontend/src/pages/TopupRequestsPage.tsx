import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface TopupRequest {
  id: string;
  amount: string;
  receipt_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  payment_method: string | null;
  nequi_transaction_id: string | null;
  created_at: string;
  student: { full_name: string; grade: string | null };
  parent: { full_name: string; email: string };
  school?: { name: string };
}

interface TopupStats { total: number; pending: number; approved: number; rejected: number; totalApproved: string }

const STATUS_LABEL: Record<string, string> = { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada' };
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  PENDING:  { background: 'rgba(195,125,13,0.1)', color: '#c37d0d' },
  APPROVED: { background: 'var(--color-brand-light)', color: 'var(--color-brand-deep)' },
  REJECTED: { background: 'rgba(212,86,86,0.1)', color: '#dc2626' },
};

function fmt(v: string) { return `$${parseFloat(v).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TopupRequestsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<TopupStats | null>(null);

  // Process modal
  const [processTarget, setProcessTarget] = useState<TopupRequest | null>(null);
  const [processAction, setProcessAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [processLoading, setProcessLoading] = useState(false);

  const isParent = user?.role === 'PARENT';
  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchRequests = useCallback((pg = page) => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set('page', String(pg)); p.set('limit', '20');
    if (statusFilter) p.set('status', statusFilter);
    if (search) p.set('search', search);
    apiClient.get<{ data: { requests: TopupRequest[]; total: number; page: number; pages: number } }>(`/topup-requests?${p}`)
      .then(r => { setRequests(r.data.data.requests); setTotalPages(r.data.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, search, page]);

  useEffect(() => { fetchRequests(page); }, [fetchRequests, page]);
  useEffect(() => {
    apiClient.get<{ data: TopupStats }>('/topup-requests/stats').then(r => setStats(r.data.data)).catch(() => {});
  }, []);

  async function confirmProcess() {
    if (!processTarget) return;
    setProcessLoading(true);
    try {
      await apiClient.post(`/topup-requests/${processTarget.id}/process`, { action: processAction });
      setProcessTarget(null);
      fetchRequests(page);
      // Refresh stats
      apiClient.get<{ data: TopupStats }>('/topup-requests/stats').then(r => setStats(r.data.data)).catch(() => {});
    } catch (e: any) {
      alert(e?.response?.data?.error ?? 'Error al procesar');
    } finally { setProcessLoading(false); }
  }

  // View receipt modal
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

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
          <p className="dashboard-label">Finanzas</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Solicitudes de Recarga</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
            Los padres pueden recargar vía <strong>transferencia manual</strong> o <strong>Nequi Push</strong>
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Pendientes', value: stats.pending, icon: '⏳', color: '#c37d0d' },
              { label: 'Aprobadas', value: stats.approved, icon: '✅', color: '#059669' },
              { label: 'Rechazadas', value: stats.rejected, icon: '❌', color: '#dc2626' },
              { label: 'Total aprobado', value: fmt(stats.totalApproved), icon: '💰', color: '#6366f1' },
            ].map(s => (
              <div key={s.label} className="user-card" style={{ padding: '12px 14px', marginBottom: 0, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 20 }}>{s.icon}</p>
                <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Methods info (admin view) */}
        {isAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div className="user-card" style={{ padding: '14px 18px', marginBottom: 0, borderLeft: '3px solid #F59E0B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>🏦</span>
                <strong style={{ fontSize: 14 }}>Transferencia Manual</strong>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                El padre envía comprobante → Admin aprueba/rechaza manualmente.
              </p>
            </div>
            <div className="user-card" style={{ padding: '14px 18px', marginBottom: 0, borderLeft: '3px solid #8B5CF6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>📱</span>
                <strong style={{ fontSize: 14 }}>Nequi Push</strong>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                Pago automático. El padre acepta en su app Nequi → saldo se acredita al confirmar.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {!isParent && (
            <input className="form-input" type="text" placeholder="Buscar estudiante..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ width: 200, marginBottom: 0 }}
            />
          )}
          <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 150, marginBottom: 0 }}>
            <option value="">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="REJECTED">Rechazadas</option>
          </select>
          {(statusFilter || search) && (
            <button className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }} onClick={() => { setStatusFilter(''); setSearch(''); }}>
              Limpiar ×
            </button>
          )}
        </div>

        {loading && <div className="roadmap-note">Cargando solicitudes...</div>}

        {!loading && requests.length === 0 && (
          <div className="roadmap-note">No hay solicitudes de recarga{statusFilter ? ' con este filtro' : ''}.</div>
        )}

        {!loading && requests.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map(req => (
              <div key={req.id} className="user-card" style={{ padding: '16px 20px', marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className="role-badge" style={{ ...STATUS_STYLE[req.status], fontSize: 11 }}>
                        {STATUS_LABEL[req.status]}
                      </span>
                      <span className="role-badge" style={{
                        fontSize: 10,
                        background: req.payment_method === 'NEQUI' ? 'rgba(139,92,246,0.1)' : 'rgba(245,158,11,0.1)',
                        color: req.payment_method === 'NEQUI' ? '#8B5CF6' : '#92400e',
                      }}>
                        {req.payment_method === 'NEQUI' ? '📱 Nequi' : '🏦 Transferencia'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {fmtDate(req.created_at)}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600 }}>{req.student.full_name}</p>
                    {!isParent && req.parent && (
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                        Padre: {req.parent.full_name} · {req.parent.email}
                      </p>
                    )}
                    {req.school && <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>{req.school.name}</p>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#059669' }}>
                      {fmt(req.amount)}
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {req.receipt_url && (
                        <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setReceiptUrl(req.receipt_url)}>
                          🖼 Comprobante
                        </button>
                      )}
                      {req.status === 'PENDING' && isAdmin && (
                        <>
                          <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: '#059669', borderColor: 'rgba(5,150,105,0.3)' }}
                            onClick={() => { setProcessTarget(req); setProcessAction('APPROVED'); }}>
                            ✅ Aprobar
                          </button>
                          <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: '#dc2626' }}
                            onClick={() => { setProcessTarget(req); setProcessAction('REJECTED'); }}>
                            ❌
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 20 }}>
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: 13, padding: '6px 14px' }}>← Anterior</button>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{page} / {totalPages}</span>
            <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ fontSize: 13, padding: '6px 14px' }}>Siguiente →</button>
          </div>
        )}
      </main>

      {/* Process confirmation modal */}
      {processTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={() => !processLoading && setProcessTarget(null)}>
          <div className="user-card" style={{ maxWidth: 440, width: '100%', padding: '32px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>{processAction === 'APPROVED' ? '✅' : '❌'}</p>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>
                ¿{processAction === 'APPROVED' ? 'Aprobar' : 'Rechazar'} recarga?
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Recarga de <strong>{fmt(processTarget.amount)}</strong> para <strong>"{processTarget.student.full_name}"</strong>
                {processAction === 'APPROVED' && <><br/>Se acreditará el saldo al estudiante.</>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={processLoading} onClick={() => setProcessTarget(null)}>Cancelar</button>
              <button style={{
                flex: 1, padding: '10px 20px', border: 'none', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: 14,
                cursor: processLoading ? 'wait' : 'pointer', opacity: processLoading ? 0.7 : 1,
                background: processAction === 'APPROVED' ? '#059669' : '#dc2626', color: '#fff',
              }} disabled={processLoading} onClick={confirmProcess}>
                {processLoading ? 'Procesando...' : processAction === 'APPROVED' ? '✅ Aprobar' : '❌ Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt viewer modal */}
      {receiptUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={() => setReceiptUrl(null)}>
          <div style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <img src={receiptUrl} alt="Comprobante" style={{ width: '100%', borderRadius: 12 }} />
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button className="btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => setReceiptUrl(null)}>
                Cerrar ×
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
