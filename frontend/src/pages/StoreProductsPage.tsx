import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Store {
  id: string;
  name: string;
  active: boolean;
  school: { id: string; name: string; city: string };
}

interface StoreProduct {
  id: string;
  store_id: string;
  product_id: string;
  price: string | null;
  stock: number | null;
  active: boolean;
  product: {
    id: string;
    name: string;
    description: string | null;
    base_price: string;
    image_url: string | null;
    category: string | null;
    is_healthy: boolean;
    customizable_options: string[];
    active: boolean;
  };
}

interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  base_price: string;
  image_url: string | null;
  category: string | null;
  is_healthy: boolean;
  active: boolean;
}

type EditingState = {
  id: string;            // storeProduct.id
  price: string;
  stock: string;
  active: boolean;
};

const categoryLabels: Record<string, string> = {
  almuerzo: '🍲 Almuerzo',
  bebida: '🥤 Bebida',
  snack: '🍿 Snack',
  otro: '📦 Otro',
};

function fmt(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(n)) return '$0';
  return `$${n.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function StoreProductsPage() {
  const { id: storeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Store info
  const [store, setStore] = useState<Store | null>(null);

  // Productos asignados a esta tienda
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [loadingSP, setLoadingSP] = useState(true);

  // Catálogo global (para el modal de agregar)
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Modal de agregar
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  // Edición inline de precio/stock
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ─── Fetch store info ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!storeId) return;
    apiClient.get<{ data: Store }>(`/stores/${storeId}`)
      .then(r => setStore(r.data.data))
      .catch(() => setError('No se pudo cargar la tienda'));
  }, [storeId]);

  // ─── Fetch store products ─────────────────────────────────────────────────
  const fetchStoreProducts = useCallback(() => {
    if (!storeId) return;
    setLoadingSP(true);
    apiClient.get<{ data: StoreProduct[] }>(`/stores/${storeId}/products`)
      .then(r => setStoreProducts(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setError('Error al cargar productos de la tienda'))
      .finally(() => setLoadingSP(false));
  }, [storeId]);

  useEffect(() => { fetchStoreProducts(); }, [fetchStoreProducts]);

  // ─── Fetch catalog ─────────────────────────────────────────────────────────
  const fetchCatalog = useCallback(() => {
    setLoadingCatalog(true);
    const assignedIds = new Set(storeProducts.map(sp => sp.product_id));
    apiClient.get<{ data: { products: CatalogProduct[]; total: number; categories: unknown[] } }>('/products?active=true&limit=200')
      .then(r => {
        const all = r.data.data.products ?? [];
        // Excluir los que ya están asignados
        setCatalog(all.filter(p => !assignedIds.has(p.id)));
      })
      .catch(() => setError('Error al cargar el catálogo'))
      .finally(() => setLoadingCatalog(false));
  }, [storeProducts]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  async function handleBulkAdd() {
    if (selectedToAdd.size === 0 || !storeId) return;
    setAdding(true);
    try {
      await apiClient.post(`/stores/${storeId}/products/bulk`, {
        product_ids: Array.from(selectedToAdd),
      });
      setShowAddModal(false);
      setSelectedToAdd(new Set());
      fetchStoreProducts();
      flash(`✅ ${selectedToAdd.size} producto(s) agregado(s) a la tienda`);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error al agregar productos');
    } finally {
      setAdding(false);
    }
  }

  function startEdit(sp: StoreProduct) {
    setEditing({
      id: sp.id,
      price: sp.price ?? '',
      stock: sp.stock !== null ? String(sp.stock) : '',
      active: sp.active,
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient.patch(`/store-products/${editing.id}`, {
        price:  editing.price !== '' ? parseFloat(editing.price) : null,
        stock:  editing.stock !== '' ? parseInt(editing.stock)   : null,
        active: editing.active,
      });
      setEditing(null);
      fetchStoreProducts();
      flash('✅ Producto actualizado');
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(sp: StoreProduct) {
    try {
      await apiClient.patch(`/store-products/${sp.id}`, { active: !sp.active });
      fetchStoreProducts();
      flash(`${!sp.active ? '✅ Activado' : '⏸ Desactivado'}: ${sp.product.name}`);
    } catch {
      setError('Error al cambiar estado del producto');
    }
  }

  async function handleRemove(sp: StoreProduct) {
    if (!confirm(`¿Quitar "${sp.product.name}" de esta tienda?`)) return;
    try {
      await apiClient.delete(`/store-products/${sp.id}`);
      fetchStoreProducts();
      flash(`🗑 "${sp.product.name}" eliminado de la tienda`);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error al quitar el producto');
    }
  }

  // ─── Derived ─────────────────────────────────────────────────────────────
  const filteredCatalog = catalog.filter(p =>
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(catalogSearch.toLowerCase()),
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            🏠 <span className="desktop-only">Inicio</span>
          </button>
          <button className="btn-ghost" onClick={() => navigate('/stores')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="desktop-only">Tiendas</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-body">

        {/* ── Header ────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p className="dashboard-label">Gestión de productos</p>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px' }}>
              {store ? `🏪 ${store.name}` : 'Cargando tienda...'}
            </h1>
            {store && (
              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
                📍 {store.school.name} — {store.school.city}
              </p>
            )}
          </div>
          <button
            className="btn-primary"
            style={{ width: 'auto' }}
            onClick={() => { setShowAddModal(true); fetchCatalog(); }}
          >
            + Agregar productos
          </button>
        </div>

        {/* ── Mensajes ───────────────────────────────────── */}
        {error && <p className="form-error" style={{ marginBottom: 16 }}>{error} <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 8 }}>×</button></p>}
        {successMsg && <div className="roadmap-note" style={{ marginBottom: 16, background: 'rgba(5,150,105,0.07)', borderColor: 'rgba(5,150,105,0.3)', color: '#047857', padding: '10px 16px', borderRadius: 8 }}>{successMsg}</div>}

        {/* ── Stats ─────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total asignados', value: storeProducts.length, icon: '📦', color: '#2563eb' },
            { label: 'Activos',  value: storeProducts.filter(s => s.active).length,  icon: '✅', color: '#059669' },
            { label: 'Inactivos', value: storeProducts.filter(s => !s.active).length, icon: '⏸',  color: '#c37d0d' },
          ].map(s => (
            <div key={s.label} className="user-card" style={{ padding: '14px 18px', marginBottom: 0, textAlign: 'center', minWidth: 110, flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontSize: 22 }}>{s.icon}</p>
              <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Lista de productos ────────────────────────── */}
        {loadingSP && <div className="roadmap-note">Cargando productos...</div>}

        {!loadingSP && storeProducts.length === 0 && (
          <div className="roadmap-note" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: 36, margin: '0 0 12px' }}>📦</p>
            <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 500 }}>Esta tienda no tiene productos aún</p>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text-muted)' }}>
              Agrega productos del catálogo global para que los padres puedan hacer pedidos
            </p>
            <button className="btn-primary" style={{ width: 'auto' }} onClick={() => { setShowAddModal(true); fetchCatalog(); }}>
              + Agregar primer producto
            </button>
          </div>
        )}

        {!loadingSP && storeProducts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {storeProducts.map(sp => (
              <div key={sp.id} className="user-card" style={{ padding: '18px 20px', marginBottom: 0, opacity: sp.active ? 1 : 0.65, transition: 'opacity 0.2s' }}>
                {editing?.id === sp.id ? (
                  /* ── Modo edición inline ── */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, flex: 1 }}>{sp.product.name}</p>
                      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                        Precio base: {fmt(sp.product.base_price)}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Precio tienda (opcional)</label>
                        <input
                          className="form-input"
                          style={{ marginBottom: 0 }}
                          type="number"
                          min="0"
                          step="100"
                          placeholder={`Base: ${sp.product.base_price}`}
                          value={editing.price}
                          onChange={e => setEditing(prev => prev ? { ...prev, price: e.target.value } : null)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Stock (opcional)</label>
                        <input
                          className="form-input"
                          style={{ marginBottom: 0 }}
                          type="number"
                          min="0"
                          placeholder="Sin límite"
                          value={editing.stock}
                          onChange={e => setEditing(prev => prev ? { ...prev, stock: e.target.value } : null)}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <label style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Activo</label>
                        <input
                          type="checkbox"
                          checked={editing.active}
                          onChange={e => setEditing(prev => prev ? { ...prev, active: e.target.checked } : null)}
                          style={{ width: 18, height: 18, accentColor: 'var(--color-brand)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                        <button className="btn-primary" style={{ width: 'auto', padding: '6px 14px', fontSize: 13 }} onClick={saveEdit} disabled={saving}>
                          {saving ? '...' : '💾 Guardar'}
                        </button>
                        <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => setEditing(null)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Vista normal ── */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {/* Imagen */}
                    <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: 'var(--color-gray-100)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                      {sp.product.image_url
                        ? <img src={sp.product.image_url} alt={sp.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '🍽️'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{sp.product.name}</p>
                        {!sp.active && <span className="role-badge" style={{ background: 'rgba(212,86,86,0.1)', color: 'var(--color-error)', fontSize: 11 }}>Inactivo</span>}
                        {sp.product.is_healthy && <span className="role-badge" style={{ fontSize: 11 }}>🥗 Saludable</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-brand-deep)', fontFamily: 'var(--font-mono)' }}>
                          {sp.price ? fmt(sp.price) : fmt(sp.product.base_price)}
                          {sp.price && <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 4, fontWeight: 400, textDecoration: 'line-through' }}>{fmt(sp.product.base_price)}</span>}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                          {categoryLabels[sp.product.category ?? 'otro'] ?? sp.product.category ?? '📦 Otro'}
                        </span>
                        {sp.stock !== null && (
                          <span style={{ fontSize: 13, color: sp.stock <= 5 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                            📦 Stock: {sp.stock}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }} onClick={() => startEdit(sp)}>
                        ✏️ Editar
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 13, padding: '5px 12px', color: sp.active ? '#c37d0d' : 'var(--color-brand-deep)' }}
                        onClick={() => handleToggleActive(sp)}
                      >
                        {sp.active ? '⏸ Desactivar' : '▶ Activar'}
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 13, padding: '5px 12px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.05)' }}
                        onClick={() => handleRemove(sp)}
                      >
                        🗑 Quitar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal: Agregar del catálogo ───────────────────────────────────── */}
      {showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={() => !adding && setShowAddModal(false)}
        >
          <div
            className="user-card"
            style={{ maxWidth: 560, width: '100%', padding: '28px 24px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>📦 Agregar productos al menú</h2>
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 16 }} onClick={() => setShowAddModal(false)}>×</button>
            </div>

            {/* Búsqueda */}
            <input
              className="form-input"
              type="text"
              placeholder="Buscar en catálogo..."
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              style={{ marginBottom: 12 }}
            />

            {/* Lista catálogo */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, maxHeight: '50vh' }}>
              {loadingCatalog && <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', padding: 24 }}>Cargando catálogo...</p>}
              {!loadingCatalog && filteredCatalog.length === 0 && (
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', padding: 24 }}>
                  {catalog.length === 0 ? 'No hay productos disponibles en el catálogo global' : 'No se encontraron productos'}
                </p>
              )}
              {filteredCatalog.map(p => {
                const isSelected = selectedToAdd.has(p.id);
                return (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 10, border: `1px solid ${isSelected ? 'var(--color-brand)' : 'var(--color-border)'}`,
                      background: isSelected ? 'rgba(24,226,153,0.07)' : 'white',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedToAdd(prev => {
                          const n = new Set(prev);
                          if (n.has(p.id)) n.delete(p.id); else n.add(p.id);
                          return n;
                        });
                      }}
                      style={{ width: 16, height: 16, accentColor: 'var(--color-brand)', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{p.name}</p>
                        {p.is_healthy && <span className="role-badge" style={{ fontSize: 10 }}>🥗</span>}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {categoryLabels[p.category ?? 'otro'] ?? p.category ?? '📦'} · {fmt(p.base_price)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Footer modal */}
            <div style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)', marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)', flex: 1 }}>
                {selectedToAdd.size > 0 ? `${selectedToAdd.size} seleccionado(s)` : 'Selecciona productos'}
              </span>
              <button className="btn-ghost" style={{ padding: '8px 16px' }} onClick={() => setShowAddModal(false)} disabled={adding}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ width: 'auto', padding: '8px 20px' }}
                onClick={handleBulkAdd}
                disabled={selectedToAdd.size === 0 || adding}
              >
                {adding ? 'Agregando...' : `Agregar ${selectedToAdd.size > 0 ? `(${selectedToAdd.size})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
