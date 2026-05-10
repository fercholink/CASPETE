import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface CategoryOption { id: string; name: string; label: string; icon: string | null; }

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  base_price: string;
  image_url: string | null;
  category: string | null;
  is_healthy: boolean;
  customizable_options: string[];
}

const emptyForm = {
  name: '',
  description: '',
  base_price: '',
  image_url: '',
  category: '',
  is_healthy: true,
  customizable_options: '',
};

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    apiClient.get<{ data: CategoryOption[] }>('/categories').then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    apiClient.get<{ data: ProductData }>(`/products/${id}`).then((res) => {
      const p = res.data.data;
      setForm({
        name: p.name,
        description: p.description ?? '',
        base_price: parseFloat(p.base_price).toString(),
        image_url: p.image_url ?? '',
        category: p.category ?? '',
        is_healthy: p.is_healthy,
        customizable_options: p.customizable_options?.join(', ') ?? '',
      });
    })
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setFetching(false));
  }, [id]);

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

    const base_price = parseFloat(form.base_price);
    if (isNaN(base_price) || base_price <= 0) {
      setError('El precio debe ser un número positivo');
      setLoading(false);
      return;
    }

    const payload = {
      name: form.name,
      base_price,
      is_healthy: form.is_healthy,
      customizable_options: form.customizable_options.split(',').map(s => s.trim()).filter(s => s.length > 0),
      ...(form.description ? { description: form.description } : {}),
      ...(form.image_url ? { image_url: form.image_url } : {}),
      ...(form.category ? { category: form.category } : {}),
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
          {isEdit ? 'Actualiza los datos del producto en el catálogo global' : 'Agrega un producto al catálogo global'}
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

          <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="base_price">Precio base (COP)</label>
              <input
                id="base_price" name="base_price" className="form-input" type="number"
                value={form.base_price} onChange={handleChange}
                required min="0.01" step="0.01" placeholder="1500"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="category">Categoría</label>
              <select
                id="category" name="category" className="form-select"
                value={form.category} onChange={handleChange}
              >
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.icon || '📦'} {c.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                id="is_healthy" name="is_healthy" type="checkbox"
                checked={form.is_healthy} onChange={handleChange}
                style={{ width: 16, height: 16, accentColor: 'var(--color-brand)', cursor: 'pointer' }}
              />
              <span>¿Saludable?</span>
            </label>
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
