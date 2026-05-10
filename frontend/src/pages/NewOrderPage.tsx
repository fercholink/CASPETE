import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Student {
  id: string;
  full_name: string;
  grade: string | null;
  balance: string;
  active: boolean;
  school: { id: string; name: string; city: string };
}

interface Store {
  id: string;
  name: string;
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
  };
}

interface CartItem {
  storeProduct: StoreProduct;
  quantity: number;
  customizations: string[];
}

function getEffectivePrice(sp: StoreProduct): number {
  return parseFloat(sp.price ?? sp.product.base_price);
}

function fmt(price: number | string) {
  const n = typeof price === 'string' ? parseFloat(price) : price;
  return `$${n.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const categoryLabels: Record<string, string> = {
  almuerzo: '🍲 Almuerzos',
  bebida: '🥤 Bebidas',
  snack: '🍿 Snacks',
  otro: '📦 Otros',
};

export default function NewOrderPage() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [storeId, setStoreId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(today());
  const [notes, setNotes] = useState('');

  const [loadingStudent, setLoadingStudent] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ data: Student[] }>('/students')
      .then((r) => setStudents(r.data.data.filter((s) => s.active)))
      .catch(() => setError('No se pudieron cargar los estudiantes'))
      .finally(() => setFetching(false));
  }, []);

  const loadStores = useCallback((schoolId: string) => {
    setLoadingStudent(true);
    setCart([]);
    setStoreId('');
    setStoreProducts([]);
    apiClient
      .get<{ data: Store[] }>(`/stores?school_id=${schoolId}`)
      .then((r) => setStores(r.data.data))
      .catch(() => setError('Error al cargar las tiendas'))
      .finally(() => setLoadingStudent(false));
  }, []);

  const loadStoreProducts = useCallback((sid: string) => {
    setLoadingProducts(true);
    setCart([]);
    apiClient
      .get<{ data: StoreProduct[] }>(`/stores/${sid}/products?active=true`)
      .then((r) => setStoreProducts(r.data.data))
      .catch(() => setError('Error al cargar los productos'))
      .finally(() => setLoadingProducts(false));
  }, []);

  function handleStudentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const student = students.find((s) => s.id === e.target.value) ?? null;
    setSelectedStudent(student);
    if (student) loadStores(student.school.id);
  }

  function handleStoreChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sid = e.target.value;
    setStoreId(sid);
    if (sid) loadStoreProducts(sid);
    else setStoreProducts([]);
  }

  function setQty(sp: StoreProduct, qty: number) {
    if (sp.stock !== null && qty > sp.stock) {
      qty = sp.stock;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.storeProduct.id === sp.id);
      if (qty <= 0) return prev.filter((i) => i.storeProduct.id !== sp.id);
      if (existing) return prev.map((i) => i.storeProduct.id === sp.id ? { ...i, quantity: qty } : i);
      return [...prev, { storeProduct: sp, quantity: qty, customizations: [] }];
    });
  }

  function toggleCustomization(spId: string, option: string) {
    setCart((prev) => prev.map((i) => {
      if (i.storeProduct.id !== spId) return i;
      const isSelected = i.customizations.includes(option);
      const newCust = isSelected ? i.customizations.filter((c) => c !== option) : [...i.customizations, option];
      return { ...i, customizations: newCust };
    }));
  }

  function getQty(spId: string) {
    return cart.find((i) => i.storeProduct.id === spId)?.quantity ?? 0;
  }

  const total = cart.reduce((s, i) => s + getEffectivePrice(i.storeProduct) * i.quantity, 0);
  const balance = selectedStudent ? parseFloat(selectedStudent.balance) : 0;
  const hasEnough = balance >= total && total > 0;

  // Agrupar por categoría
  const grouped = storeProducts.reduce<Record<string, StoreProduct[]>>((acc, sp) => {
    const cat = sp.product.category ?? 'otro';
    (acc[cat] ??= []).push(sp);
    return acc;
  }, {});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !storeId || cart.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const r = await apiClient.post<{ data: { id: string } }>('/orders', {
        student_id: selectedStudent.id,
        store_id: storeId,
        scheduled_date: scheduledDate,
        notes: notes || undefined,
        items: cart.map((i) => ({
          store_product_id: i.storeProduct.id,
          quantity: i.quantity,
          customizations: i.customizations,
        })),
      });
      navigate(`/orders/${r.data.data.id}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
          'Error al crear el pedido',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (fetching) {
    return (
      <div className="auth-page">
        <div className="roadmap-note" style={{ maxWidth: 480, width: '100%' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ justifyContent: 'flex-start', paddingTop: 40, alignItems: 'stretch', padding: '40px 24px' }}>
      <div style={{ maxWidth: 600, width: '100%', margin: '0 auto' }}>
        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 24 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a pedidos
        </Link>

        <span className="brand-badge"><span className="brand-dot" />CASPETE</span>
        <h1 className="auth-title">Nuevo pedido</h1>
        <p className="auth-subtitle">Elige el estudiante, la tienda y los productos</p>

        <form onSubmit={handleSubmit}>
          {/* Estudiante */}
          <div className="form-group">
            <label className="form-label" htmlFor="student">Estudiante</label>
            <select id="student" className="form-select" onChange={handleStudentChange} required defaultValue="">
              <option value="" disabled>Selecciona un estudiante...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}{s.grade ? ` (${s.grade})` : ''} — Saldo: {fmt(s.balance)}
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <>
              {/* Tienda + Fecha */}
              <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="store">Tienda</label>
                  {loadingStudent ? (
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '8px 0' }}>Cargando...</p>
                  ) : (
                    <select id="store" className="form-select" value={storeId} onChange={handleStoreChange} required>
                      <option value="">Selecciona...</option>
                      {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="date">Fecha de entrega</label>
                  <input
                    id="date" className="form-input" type="date"
                    value={scheduledDate} min={today()}
                    onChange={(e) => setScheduledDate(e.target.value)} required
                  />
                </div>
              </div>

              {/* Productos por categoría */}
              {storeId && !loadingProducts && storeProducts.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  {Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat} style={{ marginBottom: 20 }}>
                      <p className="form-label" style={{ marginBottom: 10, fontSize: 15 }}>
                        {categoryLabels[cat] ?? `📦 ${cat}`}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {items.map((sp) => {
                          const qty = getQty(sp.id);
                          const price = getEffectivePrice(sp);
                          const hasCustomPrice = sp.price !== null;
                          return (
                            <div key={sp.id} className="user-card" style={{ padding: '14px 16px', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                  <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 500 }}>
                                    {sp.product.name}
                                    {sp.product.is_healthy && (
                                      <span className="role-badge" style={{ marginLeft: 8, fontSize: 11 }}>Saludable</span>
                                    )}
                                  </p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                                      {fmt(price)}
                                      {hasCustomPrice && (
                                        <span style={{ textDecoration: 'line-through', marginLeft: 6, fontSize: 11, opacity: 0.5 }}>
                                          {fmt(sp.product.base_price)}
                                        </span>
                                      )}
                                    </p>
                                    {sp.stock !== null && (
                                      <span style={{ fontSize: 12, color: sp.stock <= 5 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                                        📦 Quedan: {sp.stock}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <button type="button" onClick={() => setQty(sp, qty - 1)}
                                    style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--color-border-md)', background: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                  <span style={{ width: 24, textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{qty}</span>
                                  <button type="button" onClick={() => setQty(sp, qty + 1)}
                                    disabled={sp.stock !== null && qty >= sp.stock}
                                    style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--color-border-md)', background: 'white', cursor: (sp.stock !== null && qty >= sp.stock) ? 'not-allowed' : 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (sp.stock !== null && qty >= sp.stock) ? 0.5 : 1 }}>+</button>
                                </div>
                              </div>
                              
                              {qty > 0 && sp.product.customizable_options && sp.product.customizable_options.length > 0 && (
                                <div style={{ background: 'var(--color-gray-50)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 500, color: 'var(--color-text)' }}>Personalizar:</p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                    {sp.product.customizable_options.map((opt) => {
                                      const isSelected = cart.find(i => i.storeProduct.id === sp.id)?.customizations.includes(opt);
                                      return (
                                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                          <input
                                            type="checkbox"
                                            checked={isSelected ?? false}
                                            onChange={() => toggleCustomization(sp.id, opt)}
                                            style={{ accentColor: 'var(--color-brand)' }}
                                          />
                                          {opt}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {storeId && !loadingProducts && storeProducts.length === 0 && (
                <div className="roadmap-note" style={{ marginTop: 20 }}>
                  <p style={{ margin: 0, fontSize: 14 }}>🛒 Esta tienda no tiene productos asignados aún.</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    El administrador de la tienda debe agregar productos desde el catálogo global.
                  </p>
                </div>
              )}

              {loadingProducts && (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 16 }}>Cargando productos de la tienda...</p>
              )}

              {/* Notas */}
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label" htmlFor="notes">
                  Notas <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input id="notes" className="form-input" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sin picante, alergia a maní..." />
              </div>

              {/* Resumen */}
              {cart.length > 0 && (
                <div style={{ background: 'var(--color-gray-50)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px 20px', marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Total pedido</span>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>${total.toLocaleString('es-CO')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Saldo disponible</span>
                    <span style={{ fontSize: 14, color: hasEnough ? 'var(--color-brand-deep)' : 'var(--color-error)', fontWeight: 500 }}>
                      ${balance.toLocaleString('es-CO')}
                    </span>
                  </div>
                  {!hasEnough && total > 0 && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--color-error)' }}>
                      Saldo insuficiente. Falta: ${(total - balance).toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {error && <p className="form-error" style={{ marginTop: 14 }}>{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !hasEnough || !storeId || cart.length === 0}
            style={{ marginTop: 20 }}
          >
            {submitting ? 'Creando pedido...' : 'Confirmar pedido'}
          </button>
        </form>
      </div>
    </div>
  );
}
