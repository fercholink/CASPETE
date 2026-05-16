import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import AllergenWarningModal from '../components/AllergenWarningModal';
import { SealBadgeGroup, NutritionalLevelBadge } from '../components/SealBadge';
import { SweetenerAlert, ComplianceScoreBadge } from '../components/NutritionCompliance';

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
    id: string; name: string; description: string | null;
    base_price: string; image_url: string | null;
    category: string | null; is_healthy: boolean;
    customizable_options: string[];
    // Ley 2120
    nutritional_level: 'LEVEL_1' | 'LEVEL_2';
    seal_sodium: boolean; seal_sugars: boolean;
    seal_saturated_fat: boolean; seal_trans_fat: boolean; seal_sweeteners: boolean;
    has_sweeteners: boolean;
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
  const [showAllergenModal, setShowAllergenModal] = useState(false);
  const [allergenConfirmed, setAllergenConfirmed] = useState(false);
  const [allergenAlerts, setAllergenAlerts] = useState<{ allergy: { name: string; severity: string }; product: string }[]>([]);

  useEffect(() => {
    apiClient
      .get<{ data: { students: Student[]; total: number; page: number; pages: number } }>('/students?limit=100')
      .then((r) => setStudents((r.data.data.students ?? []).filter((s) => s.active)))
      .catch(() => setError('No se pudieron cargar los estudiantes'))
      .finally(() => setFetching(false));
  }, []);

  const loadStores = useCallback((schoolId: string) => {
    setLoadingStudent(true);
    setCart([]);
    setStoreId('');
    setStoreProducts([]);
    apiClient
      .get<{ data: { stores: Store[]; total: number; page: number; pages: number } }>(`/stores?school_id=${schoolId}&active=true&limit=100`)
      .then((r) => setStores(r.data.data.stores ?? []))
      .catch(() => setError('Error al cargar las tiendas'))
      .finally(() => setLoadingStudent(false));
  }, []);

  const loadStoreProducts = useCallback((sid: string) => {
    setLoadingProducts(true);
    setCart([]);
    apiClient
      .get<{ data: StoreProduct[] }>(`/stores/${sid}/products?active=true`)
      .then((r) => setStoreProducts(Array.isArray(r.data.data) ? r.data.data : []))
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
    if (sp.stock !== null && qty > sp.stock) qty = sp.stock;
    setCart((prev) => {
      const existing = prev.find((i) => i.storeProduct.id === sp.id);
      if (qty <= 0) return prev.filter((i) => i.storeProduct.id !== sp.id);
      if (existing) return prev.map((i) => i.storeProduct.id === sp.id ? { ...i, quantity: qty } : i);
      return [...prev, { storeProduct: sp, quantity: qty, customizations: [] }];
    });
  }

  // Verificar alergias al cambiar el carrito
  useEffect(() => {
    if (!selectedStudent || cart.length === 0) { setAllergenAlerts([]); return; }
    const ids = cart.map(i => i.storeProduct.id);
    apiClient.post<{ data: { has_alert: boolean; alerts: { allergy: { name: string; severity: string }; product: string }[] } }>(
      '/allergies/check', { studentId: selectedStudent.id, storeProductIds: ids }
    ).then(r => setAllergenAlerts(r.data.data.has_alert ? r.data.data.alerts : [])).catch(() => {});
  }, [cart, selectedStudent]);

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

  // ── Compliance Ley 2120 ──────────────────────────────────────
  const complianceData = useMemo(() => {
    const cartProducts = cart.map(i => i.storeProduct.product);
    const is_seal_free = cartProducts.every(p => p.nutritional_level === 'LEVEL_1');
    const has_sweetener_alert = cartProducts.some(p => p.seal_sweeteners);
    const sweetenerNames = cart.filter(i => i.storeProduct.product.seal_sweeteners).map(i => i.storeProduct.product.name);
    const sealCount = cartProducts.reduce((acc, p) => {
      return acc + [p.seal_sodium, p.seal_sugars, p.seal_saturated_fat, p.seal_trans_fat, p.seal_sweeteners].filter(Boolean).length;
    }, 0);
    const maxSeals = cartProducts.length * 5;
    const score = maxSeals === 0 ? 100 : Math.round((1 - sealCount / maxSeals) * 100);
    return { is_seal_free, has_sweetener_alert, sweetenerNames, score };
  }, [cart]);

  // Agrupar por categoría
  const grouped = storeProducts.reduce<Record<string, StoreProduct[]>>((acc, sp) => {
    const cat = sp.product.category ?? 'otro';
    (acc[cat] ??= []).push(sp);
    return acc;
  }, {});

  // Brecha #8: interceptar submit para mostrar modal si hay alergias
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !storeId || cart.length === 0) return;
    // Si hay alertas de alergias y aun no se han confirmado, mostrar modal
    if (allergenAlerts.length > 0 && !allergenConfirmed) {
      setShowAllergenModal(true);
      return;
    }
    await doSubmitOrder();
  }

  async function doSubmitOrder() {
    if (!selectedStudent || !storeId || cart.length === 0) return;
    setShowAllergenModal(false);
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

  // IDs de productos que el estudiante es alergico (para marcar en carrito)

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
                          const isLevel2 = sp.product.nutritional_level === 'LEVEL_2';
                          return (
                            <div key={sp.id} className="user-card" style={{ padding: '14px 16px', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 12, border: isLevel2 ? '1px solid rgba(220,38,38,0.2)' : undefined }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{sp.product.name}</p>
                                    {sp.product.is_healthy && <span className="role-badge" style={{ fontSize: 11 }}>Saludable</span>}
                                    <NutritionalLevelBadge level={sp.product.nutritional_level} />
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                                      {fmt(price)}
                                      {hasCustomPrice && (
                                        <span style={{ textDecoration: 'line-through', marginLeft: 6, fontSize: 11, opacity: 0.5 }}>{fmt(sp.product.base_price)}</span>
                                      )}
                                    </p>
                                    {sp.stock !== null && (
                                      <span style={{ fontSize: 12, color: sp.stock <= 5 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>📦 Quedan: {sp.stock}</span>
                                    )}
                                  </div>
                                  {/* Sellos Ley 2120 */}
                                  {isLevel2 && (
                                    <div style={{ marginTop: 6 }}>
                                      <SealBadgeGroup
                                        sealSodium={sp.product.seal_sodium} sealSugars={sp.product.seal_sugars}
                                        sealSaturatedFat={sp.product.seal_saturated_fat} sealTransFat={sp.product.seal_trans_fat}
                                        sealSweeteners={sp.product.seal_sweeteners} size="sm"
                                      />
                                    </div>
                                  )}
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

              {/* ── Alerta ALERGIAS (Brecha #2) */}
              {allergenAlerts.length > 0 && (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(220,38,38,0.06)', border: '1.5px solid rgba(220,38,38,0.3)', marginTop: 16 }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13, color: '#dc2626' }}>
                    ⚠️ Alergia detectada — Revisión requerida
                  </p>
                  {allergenAlerts.map((a, i) => (
                    <p key={i} style={{ margin: '3px 0', fontSize: 12, color: '#7f1d1d' }}>
                      <strong>{a.product}</strong> contiene <strong>{a.allergy.name}</strong>
                      {a.allergy.severity === 'severe' && <span style={{ marginLeft: 6, background: '#dc2626', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>SEVERA</span>}
                    </p>
                  ))}
                </div>
              )}

              {/* ── Alerta edulcorantes Ley 2120 */}
              {cart.length > 0 && complianceData.has_sweetener_alert && (
                <SweetenerAlert productNames={complianceData.sweetenerNames} />
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
                  {/* Compliance Score Ley 2120 */}
                  <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                    <ComplianceScoreBadge score={complianceData.score} isSeaFree={complianceData.is_seal_free} />
                  </div>
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
            style={{ marginTop: 20, background: allergenAlerts.length > 0 && !allergenConfirmed ? '#f59e0b' : undefined }}
          >
            {submitting ? 'Creando pedido...' : allergenAlerts.length > 0 && !allergenConfirmed ? '⚠️ Confirmar (revisar alergias)' : 'Confirmar pedido'}
          </button>
        </form>

      {/* Brecha #8: Modal de confirmacion de alergias */}
      <AllergenWarningModal
        open={showAllergenModal}
        alerts={allergenAlerts}
        studentName={selectedStudent?.full_name ?? ''}
        onConfirm={() => { setAllergenConfirmed(true); setShowAllergenModal(false); void doSubmitOrder(); }}
        onCancel={() => setShowAllergenModal(false)}
      />
      </div>
    </div>
  );
}
