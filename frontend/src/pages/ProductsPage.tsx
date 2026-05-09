import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_healthy: boolean;
  active: boolean;
  stock: number | null;
  customizable_options: string[];
  created_at: string;
  school: { id: string; name: string; city: string };
  _count: { order_items: number };
}

function formatPrice(price: string) {
  return `$${parseFloat(price).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
}

export default function ProductsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canWrite = user?.role === 'VENDOR' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const fetchProducts = useCallback(() => {
    apiClient
      .get<{ data: Product[] }>('/products')
      .then((res) => {
        setProducts(res.data.data);
        setError('');
      })
      .catch((err) => {
        const msg =
          (err as { response?: { data?: { error?: string } } }).response?.data
            ?.error ?? 'Error al cargar productos';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProducts();
    // Auto-refresh every 5 seconds to keep stock and orders updated
    const interval = setInterval(() => {
      fetchProducts();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`¿Desactivar "${name}"?`)) return;
    try {
      await apiClient.delete(`/products/${id}`);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: false } : p)));
    } catch {
      alert('No se pudo desactivar el producto');
    }
  }

  async function handleDeleteProduct(product: Product) {
    if (!confirm(`⚠️ ¿Eliminar permanentemente "${product.name}"?\n\nEsta acción NO se puede deshacer.`)) return;
    if (!confirm(`Confirma: eliminar "${product.name}" para siempre.`)) return;
    try {
      await apiClient.delete(`/products/${product.id}/permanent`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (e) {
      alert((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'No se pudo eliminar el producto');
    }
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          <div>
            <p className="dashboard-label">Catálogo</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>
              Productos
            </h1>
          </div>
          {canWrite && (
            <Link
              to="/products/new"
              className="btn-primary"
              style={{ width: 'auto', textDecoration: 'none' }}
            >
              + Nuevo producto
            </Link>
          )}
        </div>

        {loading && <div className="roadmap-note">Cargando productos...</div>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <div className="roadmap-note">
            No hay productos registrados.{' '}
            {canWrite && (
              <Link to="/products/new" style={{ color: 'var(--color-brand-deep)', fontWeight: 500 }}>
                Agregar el primero
              </Link>
            )}
          </div>
        )}

        {!loading && products.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 12,
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="user-card"
                style={{ padding: '20px 24px', marginBottom: 0 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 600,
                          letterSpacing: '-0.32px',
                        }}
                      >
                        {product.name}
                      </h2>
                      {product.is_healthy && (
                        <span
                          className="role-badge"
                          style={{ fontSize: 11, background: 'var(--color-brand-light)', color: 'var(--color-brand-deep)' }}
                        >
                          Saludable
                        </span>
                      )}
                      {!product.active && (
                        <span
                          className="role-badge"
                          style={{ fontSize: 11, background: 'rgba(212,86,86,0.1)', color: 'var(--color-error)' }}
                        >
                          Inactivo
                        </span>
                      )}
                    </div>

                    {product.description && (
                      <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                        {product.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 18,
                          fontWeight: 600,
                          letterSpacing: '-0.36px',
                          color: 'var(--color-text)',
                        }}
                      >
                        {formatPrice(product.price)}
                      </p>
                      
                      <span style={{ fontSize: 13, color: product.stock !== null && product.stock <= 5 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                        📦 Stock: {product.stock !== null ? product.stock : 'Infinito'}
                      </span>
                      
                      {canWrite && (
                        <span style={{ fontSize: 13, color: 'var(--color-brand-deep)', background: 'var(--color-brand-light)', padding: '2px 8px', borderRadius: 12 }}>
                          🛒 Pedidos: {product._count?.order_items ?? 0}
                        </span>
                      )}
                    </div>

                    {product.customizable_options && product.customizable_options.length > 0 && (
                      <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                        <strong>Opciones:</strong> {product.customizable_options.join(', ')}
                      </p>
                    )}

                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {product.school.name}
                    </p>
                  </div>
                </div>

                {canWrite && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <Link to={`/products/${product.id}/edit`} className="btn-ghost" style={{ fontSize: 13, padding: '5px 14px', textDecoration: 'none' }}>Editar</Link>
                    {product.active && (
                      <button className="btn-ghost"
                        style={{ fontSize: 13, padding: '5px 14px', color: 'var(--color-error)', borderColor: 'rgba(212,86,86,0.2)' }}
                        onClick={() => handleDeactivate(product.id, product.name)}>Desactivar</button>
                    )}
                    {isSuperAdmin && (
                      <button className="btn-ghost"
                        style={{ fontSize: 13, padding: '5px 14px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.05)' }}
                        onClick={() => handleDeleteProduct(product)} title="Eliminar permanentemente">🗑 Eliminar</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
