import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface ActiveSchool {
  id: string;
  name: string;
  city: string;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_healthy: boolean;
  stock: number | null;
  customizable_options: string[];
  school: ActiveSchool;
}

const emptyForm: {
  school_id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_healthy: boolean;
  stock: string;
  customizable_options: string;
} = {
  school_id: '',
  name: '',
  description: '',
  price: '',
  image_url: '',
  is_healthy: true,
  stock: '',
  customizable_options: '',
};

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [form, setForm] = useState(emptyForm);
  const [schools, setSchools] = useState<ActiveSchool[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const tasks: Promise<unknown>[] = [];

    if (isSuperAdmin) {
      tasks.push(
        apiClient
          .get<{ data: ActiveSchool[] }>('/schools/active')
          .then((res) => setSchools(res.data.data)),
      );
    }

    if (id) {
      tasks.push(
        apiClient.get<{ data: ProductData }>(`/products/${id}`).then((res) => {
          const p = res.data.data;
          setForm({
            school_id: p.school.id,
            name: p.name,
            description: p.description ?? '',
            price: parseFloat(p.price).toString(),
            image_url: p.image_url ?? '',
            is_healthy: p.is_healthy,
            stock: p.stock !== null ? String(p.stock) : '',
            customizable_options: p.customizable_options?.join(', ') ?? '',
          });
        }),
      );
    }

    Promise.all(tasks)
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setFetching(false));
  }, [id, isSuperAdmin]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm((p) => ({ ...p, [name]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      setError('El precio debe ser un número positivo');
      setLoading(false);
      return;
    }

    const payload = {
      name: form.name,
      price,
      is_healthy: form.is_healthy,
      stock: form.stock.trim() === '' ? null : parseInt(form.stock, 10),
      customizable_options: form.customizable_options.split(',').map(s => s.trim()).filter(s => s.length > 0),
      ...(form.description ? { description: form.description } : {}),
      ...(form.image_url ? { image_url: form.image_url } : {}),
      ...(!isEdit && isSuperAdmin && form.school_id ? { school_id: form.school_id } : {}),
    };

    try {
      if (isEdit) {
        await apiClient.patch(`/products/${id}`, payload);
      } else {
        await apiClient.post('/products', payload);
      }
      navigate('/products');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? 'Error al guardar el producto';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="auth-page">
        <div className="roadmap-note" style={{ maxWidth: 440, width: '100%' }}>
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ justifyContent: 'flex-start', paddingTop: 48 }}>
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <Link
          to="/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a productos
        </Link>

        <span className="brand-badge">
          <span className="brand-dot" />
          CASPETE
        </span>

        <h1 className="auth-title">
          {isEdit ? 'Editar producto' : 'Nuevo producto'}
        </h1>
        <p className="auth-subtitle">
          {isEdit ? 'Actualiza los datos del producto' : 'Agrega un producto al catálogo'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Nombre del producto</label>
            <input
              id="name" name="name" className="form-input" type="text"
              value={form.name} onChange={handleChange} required
              placeholder="Empanada de pollo"
            />
          </div>

          {!isEdit && isSuperAdmin && (
            <div className="form-group">
              <label className="form-label" htmlFor="school_id">Colegio</label>
              <select
                id="school_id" name="school_id" className="form-select"
                value={form.school_id} onChange={handleChange} required
              >
                <option value="">Selecciona un colegio...</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="price">Precio (COP)</label>
              <input
                id="price" name="price" className="form-input" type="number"
                value={form.price} onChange={handleChange}
                required min="0.01" step="0.01" placeholder="1500"
              />
            </div>
          </div>

          <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="stock">
                Stock disponible <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>(vacío = infinito)</span>
              </label>
              <input
                id="stock" name="stock" className="form-input" type="number"
                value={form.stock} onChange={handleChange}
                min="0" placeholder="Ej: 50"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 24 }}>
                <input
                  id="is_healthy" name="is_healthy" type="checkbox"
                  checked={form.is_healthy} onChange={handleChange}
                  style={{ width: 16, height: 16, accentColor: 'var(--color-brand)', cursor: 'pointer' }}
                />
                <span>¿Saludable?</span>
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label" htmlFor="description">
              Descripción{' '}
              <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              id="description" name="description" className="form-input" type="text"
              value={form.description} onChange={handleChange}
              placeholder="Rellena con pollo desmenuzado y queso"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="customizable_options">
              Opciones de personalización <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>(separadas por comas)</span>
            </label>
            <input
              id="customizable_options" name="customizable_options" className="form-input" type="text"
              value={form.customizable_options} onChange={handleChange}
              placeholder="Ej: Sin cebolla, Doble queso, Sin salsas"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="image_url">
              URL de imagen{' '}
              <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              id="image_url" name="image_url" className="form-input" type="text"
              value={form.image_url} onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? isEdit ? 'Guardando...' : 'Creando...'
              : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </form>
      </div>
    </div>
  );
}
