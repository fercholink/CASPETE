import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import QRScanner from '../components/QRScanner';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
  product: { id: string; name: string; is_healthy: boolean };
}

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  scheduled_date: string;
  total_amount: string;
  otp_verified: boolean;
  notes: string | null;
  created_at: string;
  school: { id: string; name: string };
  student: { id: string; full_name: string; grade: string | null; photo_url?: string | null; parent_id: string };
  store: { id: string; name: string };
  order_items: OrderItem[];
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
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
function today() { return new Date().toISOString().slice(0, 10); }

export default function OrdersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isParent  = user?.role === 'PARENT';
  const isAdmin   = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isVendor  = user?.role === 'VENDOR';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Filtros — VENDOR arranca con hoy + CONFIRMED
  const [statusFilter, setStatusFilter] = useState(isVendor ? 'CONFIRMED' : '');
  const [dateFilter, setDateFilter]     = useState(isVendor ? today() : '');
  const [search, setSearch]             = useState('');
  const [isScanning, setIsScanning]     = useState(false);

  const fetchOrders = useCallback((isBackground = false) => {
    if (!isBackground) setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (dateFilter)   params.set('scheduled_date', dateFilter);
    if (search)       params.set('search', search);
    apiClient
      .get<{ data: Order[] }>(`/orders?${params.toString()}`)
      .then((r) => { setOrders(r.data.data); setError(''); })
      .catch((e) => setError((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al cargar pedidos'))
      .finally(() => setLoading(false));
  }, [statusFilter, dateFilter, search]);

  useEffect(() => { 
    fetchOrders(false); 
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function handleConfirm(id: string) {
    try {
      const r = await apiClient.patch<{ data: Order }>(`/orders/${id}/confirm`);
      setOrders((prev) => prev.map((o) => (o.id === id ? r.data.data : o)));
    } catch { alert('No se pudo confirmar el pedido'); }
  }

  async function handleBulkConfirm() {
    const pending = orders.filter((o) => o.status === 'PENDING');
    if (!confirm(`¿Confirmar ${pending.length} pedido(s) pendiente(s)${dateFilter ? ` del ${dateFilter}` : ''}?`)) return;
    try {
      const params = dateFilter ? `?scheduled_date=${dateFilter}` : '';
      await apiClient.post(`/orders/bulk-confirm${params}`);
      fetchOrders();
    } catch (e) {
      alert((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al confirmar pedidos');
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('¿Cancelar este pedido? El saldo será reembolsado.')) return;
    try {
      const r = await apiClient.patch<{ data: Order }>(`/orders/${id}/cancel`);
      setOrders((prev) => prev.map((o) => (o.id === id ? r.data.data : o)));
    } catch { alert('No se pudo cancelar el pedido'); }
  }

  async function handleDeleteOrder(order: Order) {
    if (!confirm(`⚠️ ¿Eliminar permanentemente el pedido de "${order.student.full_name}"?\n\nEsta acción NO se puede deshacer y no reembolsa saldo.`)) return;
    try {
      await apiClient.delete(`/orders/${order.id}/permanent`);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? 'Error desconocido';
      alert(`No se pudo eliminar: ${msg}`);
    }
  }

  async function handleQRScan(decodedText: string) {
    setIsScanning(false);

    if (decodedText.startsWith('CASPETE:ORDER:')) {
      const parts = decodedText.split(':');
      if (parts.length < 4) { alert('Formato de QR incorrecto'); return; }
      const orderId = parts[2];
      const otpCode = parts[3];
      try {
        setLoading(true);
        const r = await apiClient.post<{ data: Order }>(`/orders/${orderId}/deliver`, { otp_code: otpCode });
        alert(`¡Entrega exitosa para ${r.data.data.student.full_name}!`);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? r.data.data : o)));
      } catch (e) {
        alert((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al procesar entrega por QR');
      } finally { setLoading(false); }
      return;
    }

    if (decodedText.startsWith('CASPETE:STUDENT:')) {
      const parts = decodedText.split(':');
      if (parts.length < 4) { alert('Formato de QR de estudiante incorrecto'); return; }
      const studentId = parts[2];
      const deliveryCode = parts[3];
      try {
        setLoading(true);
        const r = await apiClient.post<{ data: { delivered: number; orders: Order[] } }>(`/orders/deliver-student`, { student_id: studentId, delivery_code: deliveryCode });
        alert(`¡Entrega exitosa! Se entregaron ${r.data.data.delivered} pedido(s).`);
        // Actualizar los pedidos entregados en el estado
        const updatedOrdersMap = new Map(r.data.data.orders.map((o) => [o.id, o]));
        setOrders((prev) => prev.map((o) => updatedOrdersMap.get(o.id) ?? o));
      } catch (e) {
        alert((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error en la entrega');
      } finally { setLoading(false); }
      return;
    }

    alert('QR inválido para esta plataforma');
  }

  const setToday = () => setDateFilter(today());
  const clearDate = () => setDateFilter('');

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p className="dashboard-label">Loncheras</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Pedidos</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {isVendor && (
              <button className="btn-primary" style={{ width: 'auto', background: '#3772cf' }} onClick={() => setIsScanning(true)}>
                📷 Escanear QR
              </button>
            )}
            {isParent && (
              <Link to="/orders/new" className="btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
                + Nuevo pedido
              </Link>
            )}
          </div>
        </div>

        {isScanning && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setIsScanning(false)}
          />
        )}

        {/* Filtros */}
        <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
          {/* Buscador (solo admin/vendor) */}
          {(isAdmin || isVendor) && (
            <input
              className="form-input"
              type="text"
              placeholder="Buscar estudiante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 160, marginBottom: 0 }}
            />
          )}

          {/* Fecha */}
          <input
            className="form-input"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: 160, marginBottom: 0 }}
          />

          {/* Botones rápidos de fecha */}
          <button
            className="btn-ghost"
            style={{ whiteSpace: 'nowrap', fontSize: 13, padding: '7px 14px', ...(dateFilter === today() ? { background: 'var(--color-brand-light)', borderColor: 'rgba(24,226,153,0.4)', color: 'var(--color-brand-deep)' } : {}) }}
            onClick={dateFilter === today() ? clearDate : setToday}
          >
            Hoy
          </button>

          {/* Estado */}
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 160, marginBottom: 0 }}
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="DELIVERED">Entregado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>

          {(dateFilter || statusFilter || search) && (
            <button
              className="btn-ghost"
              style={{ fontSize: 13, padding: '7px 12px', color: 'var(--color-text-muted)', width: '100%' }}
              onClick={() => { setStatusFilter(''); setDateFilter(''); setSearch(''); }}
            >
              Limpiar filtros ×
            </button>
          )}
        </div>

        {/* Acción masiva */}
        {(isAdmin || isVendor) && !loading && orders.some((o) => o.status === 'PENDING') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(195,125,13,0.06)', border: '1px solid rgba(195,125,13,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#c37d0d', fontWeight: 500 }}>
              {orders.filter((o) => o.status === 'PENDING').length} pedido(s) pendiente(s) de confirmar
            </p>
            <button
              className="btn-ghost"
              style={{ fontSize: 13, padding: '5px 14px', color: 'var(--color-brand-deep)', borderColor: 'rgba(24,226,153,0.3)', whiteSpace: 'nowrap' }}
              onClick={handleBulkConfirm}
            >
              Confirmar todos
            </button>
          </div>
        )}

        {loading && <div className="roadmap-note">Cargando pedidos...</div>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="roadmap-note">
            No hay pedidos{dateFilter || statusFilter ? ' con estos filtros' : ''}.{' '}
            {isParent && !dateFilter && !statusFilter && (
              <Link to="/orders/new" style={{ color: 'var(--color-brand-deep)', fontWeight: 500 }}>Crear el primero</Link>
            )}
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map((order) => (
              <div key={order.id} className="user-card" style={{ padding: '20px 24px', marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span className="role-badge" style={{ ...STATUS_STYLE[order.status], fontSize: 12 }}>
                        {STATUS_LABEL[order.status]}
                      </span>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                        {fmtDate(order.scheduled_date)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      {order.student.photo_url ? (
                        <img 
                          src={order.student.photo_url} 
                          alt="" 
                          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                      )}
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>
                          {order.student.full_name}
                          {order.student.grade && (
                            <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 13, marginLeft: 8 }}>
                              {order.student.grade}
                            </span>
                          )}
                        </p>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                          {order.store.name} · {order.school.name}
                        </p>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {order.order_items.map((i) => `${i.product.name} ×${i.quantity}`).join(', ')}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.36px' }}>
                      {fmt(order.total_amount)}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <Link
                        to={`/orders/${order.id}`}
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: '4px 12px', textDecoration: 'none' }}
                      >
                        Ver
                      </Link>
                      {(isAdmin || isVendor) && order.status === 'PENDING' && (
                        <button
                          className="btn-ghost"
                          style={{ fontSize: 12, padding: '4px 12px', color: 'var(--color-brand-deep)', borderColor: 'rgba(24,226,153,0.3)' }}
                          onClick={() => handleConfirm(order.id)}
                        >
                          Confirmar
                        </button>
                      )}
                      {(isAdmin || isParent || isVendor) && (order.status === 'PENDING' || ((isAdmin || isVendor) && order.status === 'CONFIRMED')) && (
                        <button
                          className="btn-ghost"
                          style={{ fontSize: 12, padding: '4px 12px', color: 'var(--color-error)', borderColor: 'rgba(212,86,86,0.2)' }}
                          onClick={() => handleCancel(order.id)}
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                          className="btn-ghost"
                          style={{
                            fontSize: 12, padding: '4px 12px',
                            color: '#dc2626',
                            borderColor: 'rgba(220,38,38,0.3)',
                            background: 'rgba(220,38,38,0.05)',
                          }}
                          onClick={() => handleDeleteOrder(order)}
                          title="Eliminar permanentemente"
                        >
                          🗑 Eliminar
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
            {orders.length} pedido{orders.length !== 1 ? 's' : ''}
          </p>
        )}
      </main>
    </>
  );
}
