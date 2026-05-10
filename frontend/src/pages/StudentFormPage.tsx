import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface ActiveSchool {
  id: string;
  name: string;
  city: string;
}

interface StudentData {
  id: string;
  full_name: string;
  national_id: string | null;
  grade: string | null;
  delivery_code: string | null;
  school: ActiveSchool;
}

const emptyForm: {
  school_id: string;
  full_name: string;
  national_id: string;
  grade: string;
  photo_url: string;
  delivery_code: string;
} = {
  school_id: '',
  full_name: '',
  national_id: '',
  grade: '',
  photo_url: '',
  delivery_code: '',
};

function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // compress to 70% jpeg
      };
      img.onerror = () => reject('Error al cargar la imagen');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject('Error al leer el archivo');
    reader.readAsDataURL(file);
  });
}

export default function StudentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [schools, setSchools] = useState<ActiveSchool[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const tasks: Promise<unknown>[] = [
      apiClient
        .get<{ data: ActiveSchool[] }>('/schools/active')
        .then((res) => setSchools(res.data.data)),
    ];

    if (id) {
      tasks.push(
        apiClient.get<{ data: StudentData }>(`/students/${id}`).then((res) => {
          const s = res.data.data;
          setForm({
            school_id: s.school.id,
            full_name: s.full_name,
            national_id: s.national_id ?? '',
            grade: s.grade ?? '',
            delivery_code: s.delivery_code ?? '',
            photo_url: (s as any).photo_url ?? '',
          });
        }),
      );
    }

    Promise.all(tasks)
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setFetching(false));
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImage(file, 400, 400);
      setForm((p) => ({ ...p, photo_url: base64 }));
    } catch (err) {
      alert('Error al procesar la imagen');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      full_name: form.full_name,
      school_id: form.school_id,
      ...(form.national_id ? { national_id: form.national_id } : {}),
      ...(form.grade ? { grade: form.grade } : {}),
      ...(form.delivery_code ? { delivery_code: form.delivery_code } : {}),
      ...(form.photo_url ? { photo_url: form.photo_url } : {}),
    };

    try {
      if (isEdit) {
        await apiClient.patch(`/students/${id}`, payload);
      } else {
        await apiClient.post('/students', payload);
      }
      navigate('/students');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? 'Error al guardar el estudiante';
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
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <Link
          to="/students"
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
          Volver a estudiantes
        </Link>

        <span className="brand-badge">
          <span className="brand-dot" />
          CASPETE
        </span>

        <h1 className="auth-title">
          {isEdit ? 'Editar estudiante' : 'Agregar hijo'}
        </h1>
        <p className="auth-subtitle">
          {isEdit
            ? 'Actualiza los datos del estudiante'
            : 'Registra a tu hijo en la plataforma'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">
              Nombre completo
            </label>
            <input
              id="full_name"
              name="full_name"
              className="form-input"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              required
              placeholder="María García"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="school_id">
              Colegio
              {isEdit && (
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>
                  (puedes cambiarlo)
                </span>
              )}
            </label>
            <select
              id="school_id"
              name="school_id"
              className="form-select"
              value={form.school_id}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un colegio...</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.city}
                </option>
              ))}
            </select>
            {schools.length === 0 && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                No hay colegios activos disponibles.
              </p>
            )}
          </div>

          <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="national_id">
                Documento{' '}
                <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>
                  (opcional)
                </span>
              </label>
              <input
                id="national_id"
                name="national_id"
                className="form-input"
                type="text"
                value={form.national_id}
                onChange={handleChange}
                placeholder="1023456789"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="grade">
                Grado{' '}
                <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>
                  (opcional)
                </span>
              </label>
              <input
                id="grade"
                name="grade"
                className="form-input"
                type="text"
                value={form.grade}
                onChange={handleChange}
                placeholder="5B"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label" htmlFor="delivery_code">
              Código de entrega (PIN de 6 dígitos){' '}
              <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>
                {isEdit ? '(Opcional: cambiar código)' : '(Opcional: se generará uno aleatorio)'}
              </span>
            </label>
            <input
              id="delivery_code"
              name="delivery_code"
              className="form-input"
              type="text"
              maxLength={6}
              pattern="\d{6}"
              value={form.delivery_code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setForm(p => ({...p, delivery_code: val}));
              }}
              placeholder="Ej: 123456"
            />
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label" htmlFor="photo">
              Fotografía para identificación <span style={{ color: 'var(--color-placeholder)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {form.photo_url ? (
                <img 
                  src={form.photo_url} 
                  alt="Previsualización" 
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--color-border)' }} 
                />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="form-input"
                  style={{ padding: '8px', fontSize: 13, cursor: 'pointer', marginBottom: 0 }}
                />
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Puedes tomar una foto o subir una imagen de galería.
                </p>
              </div>
            </div>
          </div>

          {error && <p className="form-error" style={{ marginTop: 14 }}>{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 20 }}
          >
            {loading
              ? isEdit
                ? 'Guardando...'
                : 'Registrando...'
              : isEdit
                ? 'Guardar cambios'
                : 'Registrar estudiante'}
          </button>
        </form>
      </div>
    </div>
  );
}
