import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface GpsDeviceOrder {
  id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  address: string;
  student_name: string | null;
  receipt_url: string;
  payment_reference: string | null;
  amount: string;
  status: 'PENDING' | 'PAID_CONFIRMED' | 'SHIPPED' | 'REJECTED';
  imei: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = { PENDING: 'Pendiente', PAID_CONFIRMED: 'Pago confirmado', SHIPPED: 'Enviado', REJECTED: 'Rechazado' };
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  PENDING:        { background: 'rgba(195,125,13,0.1)', color: '#c37d0d' },
  PAID_CONFIRMED: { background: 'rgba(37,99,235,0.1)', color: '#2563eb' },
  SHIPPED:        { background: 'var(--color-brand-light)', color: 'var(--color-brand-deep)' },
  REJECTED:       { background: 'rgba(212,86,86,0.1)', color: '#dc2626' },
};

function fmt(v: string) { return `$${parseFloat(v).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function GpsDeviceOrdersPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<GpsDeviceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const [rejectTarget, setRejectTarget] = useState<GpsDeviceOrder | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const [shipTarget, setShipTarget] = useState<GpsDeviceOrder | null>(null);
  const [shipImei, setShipImei] = useState('');
  const [shipTracking, setShipTracking] = useState('');
  const [shipError, setShipError] = useState('');
  const [shipLoading, setShipLoading] = useState(false);

  const fetchOrders = useCallback((pg = page) => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set('page', String(pg)); p.set('limit', '20');
    if (statusFilter) p.set('status', statusFilter);
    apiClient.get<{ orders: GpsDeviceOrder[]; total: number; page: number; pages: number }>(`/gps-device-orders?${p}`)
      .then(r => { setOrders(r.data.orders); setTotalPages(r.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { fetchOrders(page); }, [fetchOrders, page]);

  async function confirmPayment(order: GpsDeviceOrder) {
    setConfirmLoading(true);
    try {
      await apiClient.patch(`/gps-device-orders/${order.id}`, { status: 'PAID_CONFIRMED' });
      fetchOrders(page);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? 'Error al confirmar el pago');
    } finally { setConfirmLoading(false); }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    setConfirmLoading(true);
    try {
      await apiClient.patch(`/gps-device-orders/${rejectTarget.id}`, { status: 'REJECTED' });
      setRejectTarget(null);
      fetchOrders(page);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? 'Error al rechazar');
    } finally { setConfirmLoading(false); }
  }

  function openShipModal(order: GpsDeviceOrder) {
    setShipTarget(order);
    setShipImei(order.imei ?? '');
    setShipTracking(order.tracking_number ?? '');
    setShipError('');
  }

  async function confirmShip() {
    if (!shipTarget) return;
    if (shipImei.trim().length < 10) { setShipError('El IMEI debe tener al menos 10 dígitos'); return; }
    setShipLoading(true);
    setShipError('');
    try {
      await apiClient.patch(`/gps-device-orders/${shipTarget.id}`, {
        status: 'SHIPPED',
        imei: shipImei.trim(),
        tracking_number: shipTracking.trim() || undefined,
      });
      setShipTarget(null);
      fetchOrders(page);
    } catch (e: any) {
      setShipError(e?.response?.data?.error ?? 'Error al marcar como enviado');
    } finally { setShipLoading(false); }
  }

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />KIDWAY</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
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
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Pedidos de Localizador GPS</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
            Padres que pagaron el dispositivo desde la landing, antes de tener cuenta en Kidway
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 190, marginBottom: 0 }}>
            <option value="">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="PAID_CONFIRMED">Pago confirmado</option>
            <option value="SHIPPED">Enviados</option>
            <option value="REJECTED">Rechazados</option>
          </select>
        </div>

        {loading && <div className="roadmap-note">Cargando pedidos...</div>}

        {!loading && orders.length === 0 && (
          <div className="roadmap-note">No hay pedidos{statusFilter ? ' con este filtro' : ''}.</div>
        )}

        {!loading && orders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map(order => (
              <div key={order.id} className="user-card" style={{ padding: '16px 20px', marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className="role-badge" style={{ ...STATUS_STYLE[order.status], fontSize: 11 }}>
                        {STATUS_LABEL[order.status]}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {fmtDate(order.created_at)}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600 }}>
                      {order.contact_name} {order.student_name ? `— hijo/a: ${order.student_name}` : ''}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {order.contact_email} · {order.contact_phone}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                      📍 {order.city} — {order.address}
                    </p>
                    {order.payment_reference && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Ref: <strong>{order.payment_reference}</strong>
                      </p>
                    )}
                    {order.status === 'SHIPPED' && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#059669' }}>
                        IMEI: <strong>{order.imei}</strong>{order.tracking_number ? ` · Guía: ${order.tracking_number}` : ''}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#059669' }}>
                      {fmt(order.amount)}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {order.receipt_url?.startsWith('data:') && (
                        <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setReceiptUrl(order.receipt_url)}>
                          🖼 Comprobante
                        </button>
                      )}
                      {order.status === 'PENDING' && (
                        <>
                          <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: '#059669', borderColor: 'rgba(5,150,105,0.3)' }}
                            disabled={confirmLoading} onClick={() => confirmPayment(order)}>
                            ✅ Confirmar pago
                          </button>
                          <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: '#dc2626' }}
                            onClick={() => setRejectTarget(order)}>
                            ❌
                          </button>
                        </>
                      )}
                      {order.status === 'PAID_CONFIRMED' && (
                        <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: '#2563eb', borderColor: 'rgba(37,99,235,0.3)' }}
                          onClick={() => openShipModal(order)}>
                          📦 Marcar como enviado
                        </button>
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
      </main>

      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={() => !confirmLoading && setRejectTarget(null)}>
          <div className="user-card" style={{ maxWidth: 440, width: '100%', padding: '32px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>❌</p>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>¿Rechazar pedido?</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Pedido de <strong>{fmt(rejectTarget.amount)}</strong> de <strong>{rejectTarget.contact_name}</strong>. No se enviará el dispositivo.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={confirmLoading} onClick={() => setRejectTarget(null)}>Cancelar</button>
              <button style={{
                flex: 1, padding: '10px 20px', border: 'none', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: 14,
                cursor: confirmLoading ? 'wait' : 'pointer', opacity: confirmLoading ? 0.7 : 1,
                background: '#dc2626', color: '#fff',
              }} disabled={confirmLoading} onClick={confirmReject}>
                {confirmLoading ? 'Procesando...' : '❌ Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {shipTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={() => !shipLoading && setShipTarget(null)}>
          <div className="user-card" style={{ maxWidth: 440, width: '100%', padding: '32px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>📦</p>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>Marcar como enviado</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Ingresa el IMEI real del dispositivo que le vas a enviar a <strong>{shipTarget.contact_name}</strong>. Quedará listo para que lo vincule desde la app apenas se registre.
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">IMEI del dispositivo *</label>
              <input className="form-input" value={shipImei} onChange={e => setShipImei(e.target.value.replace(/\D/g, ''))} placeholder="861234567890123" />
            </div>
            <div className="form-group">
              <label className="form-label">N° de guía de envío</label>
              <input className="form-input" value={shipTracking} onChange={e => setShipTracking(e.target.value)} placeholder="Opcional" />
            </div>
            {shipError && <p className="form-error">{shipError}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={shipLoading} onClick={() => setShipTarget(null)}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1 }} disabled={shipLoading} onClick={confirmShip}>
                {shipLoading ? 'Guardando...' : '📦 Confirmar envío'}
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
