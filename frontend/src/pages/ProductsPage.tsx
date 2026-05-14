import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import { SealBadgeGroup, NutritionalLevelBadge } from '../components/SealBadge';
import { SealFreeFilter } from '../components/NutritionCompliance';

interface Product {
  id: string; name: string; description: string | null; base_price: string;
  image_url: string | null; category: string | null; is_healthy: boolean;
  active: boolean; customizable_options: string[]; created_at: string;
  _count: { store_products: number };
  // Ley 2120
  nutritional_level: 'LEVEL_1' | 'LEVEL_2';
  seal_sodium: boolean; seal_sugars: boolean;
  seal_saturated_fat: boolean; seal_trans_fat: boolean; seal_sweeteners: boolean;
  has_sweeteners: boolean;
}
interface ProductsResponse { products: Product[]; total: number; page: number; pages: number; categories: { name: string; count: number }[]; }
interface Category { id: string; name: string; label: string; icon: string | null; color: string | null; sort_order: number; active: boolean; product_count?: number; }

function fmt(price: string) { return `$${parseFloat(price).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`; }

export default function ProductsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [sealFree, setSealFree] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Category management modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', label: '', icon: '', color: '#2563eb' });
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catError, setCatError] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const isSA = user?.role === 'SUPER_ADMIN';

  // ─── Fetch ──────────────────────────────────────────────────────
  const fetchCats = useCallback(() => {
    apiClient.get<{ data: Category[] }>('/categories?all=true&counts=true')
      .then(r => setCats(r.data.data)).catch(() => {});
  }, []);

  const fetchProducts = useCallback((pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set('page', String(pg)); p.set('limit', '50');
    if (search) p.set('search', search);
    if (activeCat) p.set('category', activeCat);
    if (filterActive) p.set('active', filterActive);
    if (sealFree) p.set('seal_free', 'true');
    apiClient.get<{ data: ProductsResponse }>(`/products?${p}`)
      .then(r => { setData(r.data.data); setError(''); })
      .catch(e => setError((e as any).response?.data?.error ?? 'Error al cargar'))
      .finally(() => setLoading(false));
  }, [search, activeCat, filterActive, sealFree]);

  useEffect(() => { fetchCats(); }, [fetchCats]);
  useEffect(() => { fetchProducts(page); }, [fetchProducts, page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetchProducts(1); }, 350); return () => clearTimeout(t); }, [search]);

  // ─── Product actions ────────────────────────────────────────────
  async function handleToggle(p: Product) {
    try {
      if (p.active) await apiClient.delete(`/products/${p.id}`);
      else await apiClient.patch(`/products/${p.id}/reactivate`);
      fetchProducts(page);
    } catch { alert('Error al cambiar estado'); }
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try { await apiClient.delete(`/products/${deleteTarget.id}/permanent`); setDeleteTarget(null); fetchProducts(page); fetchCats(); }
    catch (e: any) { alert(`No se pudo eliminar: ${e?.response?.data?.error ?? e?.message ?? 'Error'}`); }
    finally { setDeleteLoading(false); }
  }

  // ─── Category CRUD ──────────────────────────────────────────────
  function openCatCreate() { setCatForm({ name: '', label: '', icon: '', color: '#2563eb' }); setEditingCat(null); setCatError(''); setShowCatModal(true); }
  function openCatEdit(c: Category) { setCatForm({ name: c.name, label: c.label, icon: c.icon ?? '', color: c.color ?? '#2563eb' }); setEditingCat(c); setCatError(''); setShowCatModal(true); }

  async function saveCat() {
    setCatSaving(true); setCatError('');
    try {
      if (editingCat) {
        await apiClient.patch(`/categories/${editingCat.id}`, { label: catForm.label, icon: catForm.icon || undefined, color: catForm.color || undefined });
      } else {
        await apiClient.post('/categories', { name: catForm.name, label: catForm.label, icon: catForm.icon || undefined, color: catForm.color || undefined });
      }
      fetchCats(); setShowCatModal(false);
    } catch (e: any) { setCatError(e?.response?.data?.error ?? 'Error al guardar'); }
    finally { setCatSaving(false); }
  }

  async function toggleCat(c: Category) {
    try { await apiClient.patch(`/categories/${c.id}`, { active: !c.active }); fetchCats(); }
    catch { alert('Error al cambiar estado'); }
  }

  async function deleteCat(c: Category) {
    setDeletingCatId(c.id);
    try { await apiClient.delete(`/categories/${c.id}`); fetchCats(); }
    catch (e: any) { alert(e?.response?.data?.error ?? 'Error al eliminar'); }
    finally { setDeletingCatId(null); }
  }

  const hasFilters = !!(search || activeCat || filterActive || sealFree);

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="desktop-only">Inicio</span>
          </button>
          <button className="btn-ghost" onClick={logout}><span className="desktop-only">Cerrar sesión</span><span className="mobile-only">Salir</span></button>
        </div>
      </nav>

      <main className="dashboard-body" style={{ maxWidth: 960 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p className="dashboard-label">Catálogo Global</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Productos</h1>
          </div>
          {isSA && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={openCatCreate} style={{ fontSize: 13 }}>🏷️ Categorías</button>
              <Link to="/products/new" className="btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>+ Nuevo producto</Link>
            </div>
          )}
        </div>

        {/* Category carousel */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, WebkitOverflowScrolling: 'touch' as any }}>
          <button onClick={() => { setActiveCat(''); setPage(1); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 16px', minWidth: 90, border: !activeCat ? '2px solid #2563eb' : '2px solid transparent', borderRadius: 14, background: !activeCat ? 'rgba(37,99,235,0.08)' : 'var(--color-surface)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}>
            <span style={{ fontSize: 28 }}>🛒</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: !activeCat ? '#2563eb' : 'var(--color-text-muted)' }}>Todos</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.7, color: 'var(--color-text-muted)' }}>{data?.total ?? 0}</span>
          </button>
          {cats.filter(c => c.active).map(cat => {
            const isAct = activeCat === cat.name;
            const clr = cat.color || '#64748b';
            return (
              <button key={cat.id} onClick={() => { setActiveCat(cat.name); setPage(1); }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 16px', minWidth: 90, border: isAct ? `2px solid ${clr}` : '2px solid transparent', borderRadius: 14, background: isAct ? `${clr}14` : 'var(--color-surface)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0, position: 'relative' }}>
                <span style={{ fontSize: 28 }}>{cat.icon || '📦'}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: isAct ? clr : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{cat.label}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.7, color: 'var(--color-text-muted)' }}>{cat.product_count ?? 0}</span>
                {isSA && <button onClick={e => { e.stopPropagation(); openCatEdit(cat); }} style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, opacity: 0.5, padding: 2 }}>⚙️</button>}
              </button>
            );
          })}
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="form-input" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 0, paddingLeft: 40 }} />
          </div>
          {/* Filtro Libre de Sellos – Ley 2120 */}
          <SealFreeFilter value={sealFree} onChange={v => { setSealFree(v); setPage(1); }} />
          {isSA && <select className="form-select" value={filterActive} onChange={e => { setFilterActive(e.target.value); setPage(1); }} style={{ width: 150, marginBottom: 0 }}><option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select>}
          {hasFilters && <button className="btn-ghost" style={{ fontSize: 13, padding: '7px 12px', color: 'var(--color-text-muted)' }} onClick={() => { setSearch(''); setActiveCat(''); setFilterActive(''); setSealFree(false); setPage(1); }}>Limpiar ×</button>}
        </div>

        {/* States */}
        {loading && <div className="roadmap-note">Cargando productos...</div>}
        {error && <p className="form-error">{error}</p>}
        {!loading && !error && data && data.products.length === 0 && (
          <div className="roadmap-note" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 48 }}>📦</p>
            <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 500 }}>{hasFilters ? 'No se encontraron productos' : 'Catálogo vacío'}</p>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text-muted)' }}>{hasFilters ? 'Intenta con otros filtros' : 'Agrega el primer producto'}</p>
            {!hasFilters && isSA && <Link to="/products/new" className="btn-primary" style={{ width: 'auto', display: 'inline-block', textDecoration: 'none' }}>+ Agregar</Link>}
          </div>
        )}

        {/* Product grid */}
        {!loading && data && data.products.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {data.products.map(product => (
              <div key={product.id} className="user-card" style={{ padding: 0, marginBottom: 0, overflow: 'hidden', opacity: product.active ? 1 : 0.6, transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ width: '100%', height: 150, background: product.image_url ? 'var(--color-surface)' : 'linear-gradient(135deg, var(--color-gray-100), rgba(37,99,235,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {product.image_url ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    : <span style={{ fontSize: 48, opacity: 0.3 }}>{cats.find(c => c.name === product.category)?.icon || '📦'}</span>}
                  <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {product.is_healthy && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(22,163,74,0.9)', color: '#fff', fontWeight: 600 }}>🥗 Saludable</span>}
                    {!product.active && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(220,38,38,0.9)', color: '#fff', fontWeight: 600 }}>Inactivo</span>}
                  </div>
                  {/* Sellos Ley 2120 — esquina inferior derecha de la imagen */}
                  {product.nutritional_level === 'LEVEL_2' && (
                    <div style={{ position: 'absolute', bottom: 6, right: 6, display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '70%' }}>
                      <SealBadgeGroup
                        sealSodium={product.seal_sodium}
                        sealSugars={product.seal_sugars}
                        sealSaturatedFat={product.seal_saturated_fat}
                        sealTransFat={product.seal_trans_fat}
                        sealSweeteners={product.seal_sweeteners}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    {product.category && <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cats.find(c => c.name === product.category)?.label || product.category}</span>}
                    <NutritionalLevelBadge level={product.nutritional_level} />
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{product.name}</h3>
                  {product.description && <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>}
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <p style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px' }}>{fmt(product.base_price)}</p>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>🏪 {product._count.store_products}</span>
                  </div>
                  {isSA && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 10, borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
                      <Link to={`/products/${product.id}/edit`} className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', textDecoration: 'none', flex: 1, textAlign: 'center' }}>✏️</Link>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: product.active ? '#c37d0d' : '#059669', flex: 1 }} onClick={() => handleToggle(product)}>{product.active ? '⏸' : '▶'}</button>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#dc2626', flex: 1 }} onClick={() => setDeleteTarget(product)}>🗑</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: 13, padding: '6px 14px' }}>← Anterior</button>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{data.page} / {data.pages}</span>
            <button className="btn-ghost" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ fontSize: 13, padding: '6px 14px' }}>Siguiente →</button>
          </div>
        )}
        {!loading && data && <p style={{ marginTop: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>{data.total} producto{data.total !== 1 ? 's' : ''}</p>}
      </main>

      {/* Delete product modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={() => !deleteLoading && setDeleteTarget(null)}>
          <div className="user-card" style={{ maxWidth: 440, width: '100%', padding: '32px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>⚠️</p>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>¿Eliminar producto?</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Se eliminará <strong>"{deleteTarget.name}"</strong> del catálogo global.</p>
              <p style={{ margin: '12px 0 0', fontSize: 13, color: '#dc2626', fontWeight: 500 }}>Esta acción NO se puede deshacer.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={deleteLoading} onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button style={{ flex: 1, padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: 14, cursor: deleteLoading ? 'wait' : 'pointer', opacity: deleteLoading ? 0.7 : 1 }} disabled={deleteLoading} onClick={confirmDelete}>{deleteLoading ? 'Eliminando...' : '🗑 Sí, eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Category management modal */}
      {showCatModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={() => !catSaving && setShowCatModal(false)}>
          <div className="user-card" style={{ maxWidth: 520, width: '100%', padding: '28px 24px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 600 }}>🏷️ {editingCat ? 'Editar categoría' : 'Gestión de categorías'}</h2>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, padding: '16px', background: 'var(--color-gray-100)', borderRadius: 12 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{editingCat ? `Editando: ${editingCat.label}` : 'Nueva categoría'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {!editingCat && <input className="form-input" placeholder="Slug (ej: bebida)" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))} style={{ marginBottom: 0 }} required />}
                <input className="form-input" placeholder="Nombre visible" value={catForm.label} onChange={e => setCatForm(f => ({ ...f, label: e.target.value }))} style={{ marginBottom: 0, gridColumn: editingCat ? '1 / -1' : undefined }} required />
                <input className="form-input" placeholder="Icono emoji" value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} style={{ marginBottom: 0 }} maxLength={4} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} style={{ width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Color</span>
                </div>
              </div>
              {catError && <p className="form-error" style={{ margin: 0 }}>{catError}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                {editingCat && <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { setEditingCat(null); setCatForm({ name: '', label: '', icon: '', color: '#2563eb' }); }}>Cancelar edición</button>}
                <button className="btn-primary" style={{ flex: 1 }} disabled={catSaving || !catForm.label || (!editingCat && !catForm.name)} onClick={saveCat}>{catSaving ? 'Guardando...' : editingCat ? 'Guardar cambios' : 'Crear categoría'}</button>
              </div>
            </div>

            {/* Existing categories list */}
            <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>Categorías existentes ({cats.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cats.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', opacity: c.active ? 1 : 0.5 }}>
                  <span style={{ fontSize: 22 }}>{c.icon || '📦'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{c.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{c.name} · {c.product_count ?? 0} productos</p>
                  </div>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: c.color || '#ccc', flexShrink: 0 }} />
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => openCatEdit(c)}>✏️</button>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: c.active ? '#c37d0d' : '#059669' }} onClick={() => toggleCat(c)}>{c.active ? '⏸' : '▶'}</button>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: '#dc2626' }} disabled={deletingCatId === c.id} onClick={() => { if (confirm(`¿Eliminar categoría "${c.label}"?`)) deleteCat(c); }}>🗑</button>
                </div>
              ))}
              {cats.length === 0 && <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', padding: 16 }}>No hay categorías. Crea la primera arriba.</p>}
            </div>

            <button className="btn-ghost" style={{ width: '100%', marginTop: 16 }} onClick={() => setShowCatModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
}
