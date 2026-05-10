import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import QRCodeLib from 'react-qr-code';
import QRScanner from '../components/QRScanner';

// Fix para el problema de exportación en Vite
const QRCode = (QRCodeLib as any).default || QRCodeLib;

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
  student: { id: string; full_name: string; grade: string | null; photo_url?: string | null; parent_id: string; balance: string };
  store: { id: string; name: string };
  deliverer: { id: string; full_name: string } | null;
  order_items: {
    id: string;
    quantity: number;
    unit_price: string;
    subtotal: string;
    customizations: string[];
    // El backend retorna store_product.product (no product directamente)
    store_product: {
      id: string;
      price: string | null;
      product: { id: string; name: string; is_healthy: boolean; base_price: string; image_url?: string | null };
    } | null;
    // Compatibilidad: algunos endpoints pueden retornar product directo
    product?: { id: string; name: string; is_healthy: boolean };
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
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  const hora  = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${fecha} a las ${hora}`;
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
  const [isScanning, setIsScanning] = useState(false);

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

  async function handleQRScan(decodedText: string) {
    setIsScanning(false);
    setOtpError('');

    // Formato: CASPETE:STUDENT:studentId:deliveryCode
    if (decodedText.startsWith('CASPETE:STUDENT:')) {
      const parts = decodedText.split(':');
      if (parts.length < 4) { setOtpError('Formato de QR incorrecto'); return; }
      const studentId = parts[2];
      const deliveryCode = parts[3];
      setDelivering(true);
      try {
        const r = await apiClient.post<{ data: { delivered: number; orders: Order[] } }>('/orders/deliver-student', {
          student_id: studentId,
          delivery_code: deliveryCode,
        });
        if (r.data.data.orders.length > 0) {
          setOrder(r.data.data.orders.find(o => o.id === id) ?? r.data.data.orders[0]);
        }
        alert(`✅ Entregado exitosamente`);
      } catch (err) {
        setOtpError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al entregar');
      } finally {
        setDelivering(false);
      }
      return;
    }

    // Formato: CASPETE:ORDER:orderId:otpCode
    if (decodedText.startsWith('CASPETE:ORDER:')) {
      const parts = decodedText.split(':');
      if (parts.length < 4) { setOtpError('Formato de QR incorrecto'); return; }
      const otpCode = parts[3];
      setOtp(otpCode);
      setDelivering(true);
      try {
        const r = await apiClient.post<{ data: Order }>(`/orders/${id}/deliver`, { otp_code: otpCode });
        setOrder(r.data.data);
      } catch (err) {
        setOtpError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Código inválido');
      } finally {
        setDelivering(false);
      }
      return;
    }

    setOtpError('QR inválido para esta plataforma');
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            {order.student.photo_url ? (
              <img 
                src={order.student.photo_url} 
                alt="Foto del estudiante" 
                style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
              />
            ) : (
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            )}
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.48px' }}>
                {order.student.full_name}
                {order.student.grade && (
                  <span style={{ fontWeight: 400, fontSize: 16, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                    {order.student.grade}
                  </span>
                )}
              </h1>
            </div>
          </div>
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
          {order.order_items.map((item) => {
            // El backend retorna store_product.product; soportar ambas estructuras
            const prod = item.product ?? item.store_product?.product;
            return (
              <div key={item.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                  <span>
                    {prod?.name ?? 'Producto'}
                    {prod?.is_healthy && <span className="role-badge" style={{ marginLeft: 8, fontSize: 11 }}>Saludable</span>}
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>×{item.quantity}</span>
                  </span>
                  <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{fmt(item.subtotal)}</span>
                </div>
                {item.customizations && item.customizations.length > 0 && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    <strong style={{ fontWeight: 500 }}>Personalización:</strong> {item.customizations.join(', ')}
                  </p>
                )}
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
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
              marginBottom: 16
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
            
            <p className="dashboard-label" style={{ marginBottom: 8 }}>O escanea este QR</p>
            <div style={{ display: 'flex', justifyContent: 'center', background: '#fff', padding: 16, borderRadius: 16, border: '1px solid var(--color-border)', width: 'fit-content', margin: '0 auto' }}>
              <QRCode value={`CASPETE:STUDENT:${order.student.id}:${order.otp_code}`} size={160} />
            </div>
          </div>
        )}

        {/* QR Scanner modal para vendor */}
        {isScanning && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setIsScanning(false)}
          />
        )}

        {/* Formulario de entrega para VENDOR */}
        {isVendor && order.status === 'CONFIRMED' && (
          <div className="user-card" style={{ marginBottom: 12 }}>
            <p className="dashboard-label" style={{ marginBottom: 8 }}>Verificar entrega</p>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Escanea el QR del estudiante o ingresa el código de 6 dígitos
            </p>

            {/* Botón escanear QR */}
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginBottom: 12, background: '#3772cf', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => setIsScanning(true)}
              disabled={delivering}
            >
              <span style={{ fontSize: 18 }}>📷</span> Escanear QR
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--color-text-muted)', fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span>o ingresa el código</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            <form onSubmit={handleDeliver} style={{ display: 'flex', gap: 10 }}>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={{ flex: 1, textAlign: 'center', fontSize: 24, fontFamily: 'var(--font-mono)', letterSpacing: 8 }}
              />
              <button type="submit" className="btn-primary" disabled={otp.length !== 6 || delivering} style={{ width: 'auto', whiteSpace: 'nowrap' }}>
                {delivering ? '...' : 'Entregar'}
              </button>
            </form>
            {otpError && <p className="form-error" style={{ marginTop: 8 }}>{otpError}</p>}
          </div>
        )}

        {order.status === 'DELIVERED' && (
          <div className="user-card" style={{ marginBottom: 12, textAlign: 'center', background: 'rgba(55,114,207,0.04)' }}>
            <p style={{ margin: '0 0 6px', fontSize: 20 }}>✅</p>
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#3772cf' }}>
              Pedido entregado
            </p>
            {order.delivered_at && (
              <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                📅 {fmtDateTime(order.delivered_at)}
              </p>
            )}
            {order.deliverer && (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                👤 Entregado por <strong>{order.deliverer.full_name}</strong>
              </p>
            )}
          </div>
        )}

        {/* Acciones adicionales en detalle */}
        {order.status === 'PENDING' && (user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'VENDOR') && (
          <button 
            className="btn-primary" 
            style={{ width: '100%', marginBottom: 12 }}
            onClick={async () => {
              try {
                const r = await apiClient.patch<{ data: Order }>(`/orders/${order.id}/confirm`);
                setOrder(r.data.data);
              } catch { alert('No se pudo confirmar el pedido'); }
            }}
          >
            Confirmar pedido
          </button>
        )}

        <button className="btn-ghost" onClick={() => navigate('/orders')} style={{ width: '100%', marginTop: 8 }}>
          Volver a pedidos
        </button>
      </div>
    </div>
  );
}
