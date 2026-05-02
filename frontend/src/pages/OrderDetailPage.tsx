import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  scheduled_date: string;
  total_amount: string;
  delivered_at: string | null;
  otp_verified: boolean;
  notes: string | null;
  otp_code: string | null;
  created_at: string;
  school: { id: string; name: string };
  student: { id: string; full_name: string; grade: string | null; parent_id: string; balance: string };
  store: { id: string; name: string };
  deliverer: { id: string; full_name: string } | null;
  order_items: {
    id: string;
    quantity: number;
    unit_price: string;
    subtotal: string;
    product: { id: string; name: string; is_healthy: boolean };
  }[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
};
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  PENDING:   { background: 'rgba(195,125,13,0.1)', color: '#c37d0d' },
  CONFIRMED: { background: 'var(--color-brand-light)', color: 'var(--color-brand-deep)' },
  DELIVERED: { background: 'rgba(55,114,207,0.1)', color: '#3772cf' },
  CANCELLED: { background: 'rgba(212,86,86,0.1)', color: 'var(--color-error)' },
  REFUNDED:  { background: 'var(--color-gray-100)', color: 'var(--color-text-muted)' },
};

function fmt(price: string) {
  return `$${parseFloat(price).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiClient
      .get<{ data: Order }>(`/orders/${id}`)
      .then((r) => setOrder(r.data.data))
      .catch((e) => setError((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDeliver(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setDelivering(true);
    setOtpError('');
    try {
      const r = await apiClient.post<{ data: Order }>(`/orders/${id}/deliver`, { otp_code: otp });
      setOrder(r.data.data);
      setOtp('');
    } catch (err: unknown) {
      setOtpError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'OTP inválido',
      );
    } finally {
      setDelivering(false);
    }
  }

  if (loading) return <div className="auth-page"><div className="roadmap-note" style={{ maxWidth: 560, width: '100%' }}>Cargando...</div></div>;
  if (error || !order) return <div className="auth-page"><p className="form-error" style={{ maxWidth: 560, width: '100%' }}>{error || 'Pedido no encontrado'}</p></div>;

  const isVendor = user?.role === 'VENDOR';
  const isParent = user?.role === 'PARENT';

  return (
    <div className="auth-page" style={{ justifyContent: 'flex-start', paddingTop: 40, alignItems: 'stretch', padding: '40px 24px' }}>
      <div style={{ maxWidth: 560, width: '100%', margin: '0 auto' }}>
        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 24 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a pedidos
        </Link>

        {/* Header */}
        <div className="user-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="role-badge" style={{ ...STATUS_STYLE[order.status] }}>
              {STATUS_LABEL[order.status]}
            </span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
              {order.id.slice(0, 8)}...
            </span>
          </div>

          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.48px' }}>
            {order.student.full_name}
            {order.student.grade && (
              <span style={{ fontWeight: 400, fontSize: 16, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                {order.student.grade}
              </span>
            )}
          </h1>
          <p style={{ margin: '0 0 4px', fontSize: 14, color: 'var(--color-text-muted)' }}>
            {order.store.name} · {order.school.name}
          </p>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Entrega: {fmtDate(order.scheduled_date)}
          </p>
          {order.notes && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
              "{order.notes}"
            </p>
          )}
        </div>

        {/* Items */}
        <div className="user-card" style={{ marginBottom: 12 }}>
          <p className="dashboard-label" style={{ marginBottom: 12 }}>Productos</p>
          {order.order_items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span>
                {item.product.name}
                {item.product.is_healthy && <span className="role-badge" style={{ marginLeft: 8, fontSize: 11 }}>Saludable</span>}
                <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>×{item.quantity}</span>
              </span>
              <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{fmt(item.subtotal)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.36px' }}>{fmt(order.total_amount)}</span>
          </div>
        </div>

        {/* OTP para PARENT — solo si CONFIRMED */}
        {isParent && order.status === 'CONFIRMED' && order.otp_code && (
          <div className="user-card" style={{ marginBottom: 12, textAlign: 'center' }}>
            <p className="dashboard-label" style={{ marginBottom: 8 }}>Código de entrega</p>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Muestra este código al vendedor al momento de la entrega
            </p>
            <div style={{
              display: 'inline-flex', gap: 8, padding: '16px 32px',
              background: 'var(--color-brand-light)', borderRadius: 16,
              border: '1px solid rgba(24,226,153,0.3)',
            }}>
              {order.otp_code.split('').map((digit, i) => (
                <span key={i} style={{
                  fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)',
                  color: 'var(--color-brand-deep)', letterSpacing: '-1px',
                }}>
                  {digit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Formulario de entrega para VENDOR */}
        {isVendor && order.status === 'CONFIRMED' && (
          <div className="user-card" style={{ marginBottom: 12 }}>
            <p className="dashboard-label" style={{ marginBottom: 8 }}>Verificar entrega</p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Ingresa el código de 4 dígitos que te muestra el padre/madre
            </p>
            <form onSubmit={handleDeliver} style={{ display: 'flex', gap: 10 }}>
              <input
                className="form-input"
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                style={{ flex: 1, textAlign: 'center', fontSize: 24, fontFamily: 'var(--font-mono)', letterSpacing: 8 }}
              />
              <button type="submit" className="btn-primary" disabled={otp.length !== 4 || delivering} style={{ width: 'auto', whiteSpace: 'nowrap' }}>
                {delivering ? '...' : 'Entregar'}
              </button>
            </form>
            {otpError && <p className="form-error" style={{ marginTop: 8 }}>{otpError}</p>}
          </div>
        )}

        {/* Entregado */}
        {order.status === 'DELIVERED' && (
          <div className="user-card" style={{ marginBottom: 12, textAlign: 'center', background: 'rgba(55,114,207,0.04)' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#3772cf' }}>
              ✓ Entregado {order.delivered_at ? `el ${fmtDate(order.delivered_at)}` : ''}
              {order.deliverer && ` por ${order.deliverer.full_name}`}
            </p>
          </div>
        )}

        <button className="btn-ghost" onClick={() => navigate('/orders')} style={{ width: '100%', marginTop: 8 }}>
          Volver a pedidos
        </button>
      </div>
    </div>
  );
}
