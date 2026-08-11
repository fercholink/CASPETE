import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';

interface GpsPaymentRequest {
  id: string;
  type: 'DEVICE' | 'MONTHLY_SUBSCRIPTION';
  amount: string;
  receipt_url: string;
  payment_reference: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  period_end: string | null;
  created_at: string;
  tracker: { id: string; device_name: string | null; student: { full_name: string } | null };
  parent: { full_name: string; email: string };
}

const STATUS_LABEL: Record<string, string> = { PENDING: 'Pendiente', APPROVED: 'Aprobado', REJECTED: 'Rechazado' };
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  PENDING:  { background: 'rgba(195,125,13,0.1)', color: '#c37d0d' },
  APPROVED: { background: 'var(--color-brand-light)', color: 'var(--color-brand-deep)' },
  REJECTED: { background: 'rgba(212,86,86,0.1)', color: '#dc2626' },
};
const TYPE_LABEL: Record<string, string> = { DEVICE: '📦 Dispositivo', MONTHLY_SUBSCRIPTION: '📅 Mensualidad' };

function fmt(v: string) { return `$${parseFloat(v).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function GpsPaymentsPage() {
  const [requests, setRequests] = useState<GpsPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const [processTarget, setProcessTarget] = useState<GpsPaymentRequest | null>(null);
  const [processAction, setProcessAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [processLoading, setProcessLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const fetchRequests = useCallback((pg = page) => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set('page', String(pg)); p.set('limit', '20');
    if (statusFilter) p.set('status', statusFilter);
    apiClient.get<{ data: { requests: GpsPaymentRequest[]; total: number; page: number; pages: number } }>(`/gps-payments?${p}`)
      .then(r => { setRequests(r.data.data.requests); setTotalPages(r.data.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { fetchRequests(page); }, [fetchRequests, page]);

  async function confirmProcess() {
    if (!processTarget) return;
    setProcessLoading(true);
    try {
      await apiClient.post(`/gps-payments/${processTarget.id}/process`, { action: processAction });
      setProcessTarget(null);
      fetchRequests(page);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? 'Error al procesar');
    } finally { setProcessLoading(false); }
  }

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <p className="dashboard-label">Finanzas</p>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.44px' }}>Pagos del Plan "Solo GPS"</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
          Dispositivo ($120.000 pago único) y mensualidad ($25.000) de padres sin colegio afiliado
        </p>
      </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 170, marginBottom: 0 }}>
            <option value="">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobados</option>
            <option value="REJECTED">Rechazados</option>
          </select>
        </div>

        {loading && <div className="roadmap-note">Cargando solicitudes...</div>}

        {!loading && requests.length === 0 && (
          <div className="roadmap-note">No hay solicitudes{statusFilter ? ' con este filtro' : ''}.</div>
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
                      <span className="role-badge" style={{ fontSize: 10, background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
                        {TYPE_LABEL[req.type]}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {fmtDate(req.created_at)}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600 }}>
                      {req.tracker.student?.full_name ?? '—'} {req.tracker.device_name ? `(${req.tracker.device_name})` : ''}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                      Padre: {req.parent.full_name} · {req.parent.email}
                    </p>
                    {req.payment_reference && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Ref: <strong>{req.payment_reference}</strong>
                      </p>
                    )}
                    {req.status === 'APPROVED' && req.period_end && req.type === 'MONTHLY_SUBSCRIPTION' && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#059669' }}>
                        Cubre hasta {fmtDate(req.period_end)}
                      </p>
                    )}
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
                      {req.status === 'PENDING' && (
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

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 20 }}>
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: 13, padding: '6px 14px' }}>← Anterior</button>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{page} / {totalPages}</span>
            <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ fontSize: 13, padding: '6px 14px' }}>Siguiente →</button>
          </div>
        )}

      {processTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={() => !processLoading && setProcessTarget(null)}>
          <div className="user-card" style={{ maxWidth: 440, width: '100%', padding: '32px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>{processAction === 'APPROVED' ? '✅' : '❌'}</p>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>
                ¿{processAction === 'APPROVED' ? 'Aprobar' : 'Rechazar'} pago?
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                {TYPE_LABEL[processTarget.type]} de <strong>{fmt(processTarget.amount)}</strong> para{' '}
                <strong>"{processTarget.tracker.student?.full_name ?? '—'}"</strong>
                {processAction === 'APPROVED' && processTarget.type === 'DEVICE' && <><br />Se marcará el dispositivo como comprado.</>}
                {processAction === 'APPROVED' && processTarget.type === 'MONTHLY_SUBSCRIPTION' && <><br />Se extenderá la mensualidad por 1 mes y se reactivará el rastreo si estaba en pausa.</>}
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
