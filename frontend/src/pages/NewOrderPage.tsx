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

interface Product {
  id: string;
  name: string;
  price: string;
  description: string | null;
  is_healthy: boolean;
  active: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

function fmt(price: string) {
  return `$${parseFloat(price).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewOrderPage() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [storeId, setStoreId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(today());
  const [notes, setNotes] = useState('');

  const [loadingStudent, setLoadingStudent] = useState(false);
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

  const loadSchoolData = useCallback((schoolId: string) => {
    setLoadingStudent(true);
    setCart([]);
    setStoreId('');
    Promise.all([
      apiClient.get<{ data: Store[] }>(`/stores?school_id=${schoolId}`).then((r) => setStores(r.data.data)),
      apiClient.get<{ data: Product[] }>(`/products?school_id=${schoolId}`).then((r) => setProducts(r.data.data.filter((p) => p.active))),
    ])
      .catch(() => setError('Error al cargar tiendas y productos'))
      .finally(() => setLoadingStudent(false));
  }, []);

  function handleStudentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const student = students.find((s) => s.id === e.target.value) ?? null;
    setSelectedStudent(student);
    if (student) loadSchoolData(student.school.id);
  }

  function setQty(product: Product, qty: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (qty <= 0) return prev.filter((i) => i.product.id !== product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: qty } : i);
      return [...prev, { product, quantity: qty }];
    });
  }

  function getQty(productId: string) {
    return cart.find((i) => i.product.id === productId)?.quantity ?? 0;
  }

  const total = cart.reduce((s, i) => s + parseFloat(i.product.price) * i.quantity, 0);
  const balance = selectedStudent ? parseFloat(selectedStudent.balance) : 0;
  const hasEnough = balance >= total && total > 0;

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
        items: cart.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
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
          ← Volver a pedidos
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="store">Tienda</label>
                  {loadingStudent ? (
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '8px 0' }}>Cargando...</p>
                  ) : (
                    <select id="store" className="form-select" value={storeId} onChange={(e) => setStoreId(e.target.value)} required>
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

              {/* Productos */}
              {!loadingStudent && products.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p className="form-label" style={{ marginBottom: 12 }}>Productos</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {products.map((product) => {
                      const qty = getQty(product.id);
                      return (
                        <div key={product.id} className="user-card" style={{ padding: '14px 16px', marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 500 }}>
                              {product.name}
                              {product.is_healthy && (
                                <span className="role-badge" style={{ marginLeft: 8, fontSize: 11 }}>Saludable</span>
                              )}
                            </p>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>{fmt(product.price)}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button type="button" onClick={() => setQty(product, qty - 1)}
                              style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--color-border-md)', background: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <span style={{ width: 24, textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{qty}</span>
                            <button type="button" onClick={() => setQty(product, qty + 1)}
                              style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--color-border-md)', background: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
