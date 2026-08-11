import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import ImageCropper from '../components/ImageCropper';

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  active: boolean;
  sort_order: number;
}

// Mismo aspecto con el que se muestra la tarjeta en la galería (w-64 h-56 → 8:7)
const CROP_ASPECT_W = 8;
const CROP_ASPECT_H = 7;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function GpsGalleryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / edit modal
  const [editTarget, setEditTarget] = useState<GalleryImage | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [editActive, setEditActive] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [cropSrc, setCropSrc] = useState<string | null>(null);

  useEffect(() => { fetchImages(); }, []);

  async function fetchImages() {
    setLoading(true);
    try {
      const r = await apiClient.get<{ data: GalleryImage[] }>('/gps-gallery');
      setImages(r.data.data);
    } catch {} finally { setLoading(false); }
  }

  function openEdit(img: GalleryImage) {
    setEditTarget(img);
    setEditImageUrl(img.image_url);
    setEditCaption(img.caption ?? '');
    setEditSortOrder(img.sort_order);
    setEditActive(img.active);
    setSaveError('');
  }

  function openCreate() {
    setCreateMode(true);
    setEditImageUrl('');
    setEditCaption('');
    setEditSortOrder(images.length);
    setEditActive(true);
    setSaveError('');
  }

  function closeEdit() {
    setEditTarget(null);
    setCreateMode(false);
    setSaveError('');
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCropSrc(await readFileAsDataUrl(file));
    } catch {
      setSaveError('No se pudo procesar la imagen');
    }
    e.target.value = '';
  }

  async function handleSave() {
    if (!editImageUrl) { setSaveError('Debes subir una imagen'); return; }
    setSaveLoading(true); setSaveError('');
    try {
      const body = {
        image_url: editImageUrl,
        caption: editCaption.trim() || undefined,
        sort_order: editSortOrder,
        active: editActive,
      };
      if (createMode) {
        await apiClient.post('/gps-gallery', body);
      } else {
        if (!editTarget) return;
        await apiClient.put(`/gps-gallery/${editTarget.id}`, body);
      }
      closeEdit();
      fetchImages();
    } catch (e: any) {
      setSaveError(e?.response?.data?.error ?? 'Error al guardar');
    } finally { setSaveLoading(false); }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/gps-gallery/${deleteId}`);
      setDeleteId(null);
      fetchImages();
    } catch {} finally { setDeleteLoading(false); }
  }

  if (user?.role !== 'SUPER_ADMIN') {
    return <div className="auth-page"><p className="form-error">Acceso denegado</p></div>;
  }

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />KIDWAY</span>
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p className="dashboard-label">Landing</p>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Galería del Localizador GPS</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
              Estas fotos aparecen en la sección "Ubicación y Llamadas" de kidway.co/funcionalidades.
            </p>
          </div>
          <button className="btn-primary" style={{ flexShrink: 0, fontSize: 13, padding: '8px 18px' }} onClick={openCreate}>
            + Nueva imagen
          </button>
        </div>

        {loading && <div className="roadmap-note">Cargando...</div>}

        {!loading && images.length === 0 && (
          <div className="roadmap-note">Aún no has agregado ninguna imagen.</div>
        )}

        {!loading && images.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {images.map(img => (
              <div key={img.id} className="user-card" style={{ padding: 0, marginBottom: 0, opacity: img.active ? 1 : 0.5, overflow: 'hidden' }}>
                <img src={img.image_url} alt={img.caption ?? 'Localizador GPS'} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <span className="role-badge" style={{ fontSize: 10, background: img.active ? 'var(--color-brand-light)' : 'rgba(220,38,38,0.1)', color: img.active ? 'var(--color-brand-deep)' : '#dc2626' }}>
                      {img.active ? 'Activa' : 'Oculta'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Orden: {img.sort_order}</span>
                  </div>
                  {img.caption && <p style={{ margin: '0 0 10px', fontSize: 13 }}>{img.caption}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-ghost" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} onClick={() => openEdit(img)}>✏️ Editar</button>
                    <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 10px', color: '#dc2626' }} onClick={() => setDeleteId(img.id)}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit modal */}
      {(editTarget || createMode) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={() => !saveLoading && closeEdit()}>
          <div className="user-card" style={{ maxWidth: 480, width: '100%', padding: '32px 28px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                {createMode ? 'Nueva imagen' : 'Editar imagen'}
              </h2>
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 18, lineHeight: 1 }} onClick={closeEdit}>×</button>
            </div>

            <div className="form-group">
              <label className="form-label">Imagen</label>
              <input type="file" accept="image/*" className="form-input" onChange={handleFileChange} />
              {editImageUrl && (
                <>
                  <img src={editImageUrl} alt="Vista previa" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10, marginTop: 10 }} />
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '6px 12px', marginTop: 8 }}
                    onClick={() => setCropSrc(editImageUrl)}
                  >
                    ✂️ Ajustar recorte / zoom
                  </button>
                </>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Descripción (opcional)</label>
              <input className="form-input" value={editCaption} onChange={e => setEditCaption(e.target.value)} placeholder="Ej: Localizador con botón SOS" maxLength={200} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Orden</label>
                <input type="number" className="form-input" value={editSortOrder} onChange={e => setEditSortOrder(Number(e.target.value))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  Visible en la landing
                </label>
              </div>
            </div>

            {saveError && <p className="form-error" style={{ marginTop: 12, marginBottom: 0 }}>{saveError}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={saveLoading} onClick={closeEdit}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1 }} disabled={saveLoading} onClick={handleSave}>
                {saveLoading ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
          onClick={() => !deleteLoading && setDeleteId(null)}>
          <div className="user-card" style={{ maxWidth: 400, width: '100%', padding: '28px 24px' }} onClick={e => e.stopPropagation()}>
            <p style={{ margin: '0 0 20px', fontSize: 14 }}>¿Eliminar esta imagen de la galería? No se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} disabled={deleteLoading} onClick={() => setDeleteId(null)}>Cancelar</button>
              <button style={{ flex: 1, padding: '10px 20px', border: 'none', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: 14, cursor: deleteLoading ? 'wait' : 'pointer', background: '#dc2626', color: '#fff' }} disabled={deleteLoading} onClick={confirmDelete}>
                {deleteLoading ? 'Eliminando...' : '🗑 Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          aspectW={CROP_ASPECT_W}
          aspectH={CROP_ASPECT_H}
          onCancel={() => setCropSrc(null)}
          onConfirm={(dataUrl) => { setEditImageUrl(dataUrl); setCropSrc(null); }}
        />
      )}
    </>
  );
}
