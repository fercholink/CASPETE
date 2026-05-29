import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface School {
  id: string;
  name: string;
}

interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Communication {
  id: string;
  title: string;
  body: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
  sender: UserSummary;
  receiver: UserSummary;
  school: School;
}

export default function CommunicationsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'inbox' | 'outbox'>('inbox');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modales y Formulario
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [recipients, setRecipients] = useState<UserSummary[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [attachment, setAttachment] = useState('');
  const [composeError, setComposeError] = useState('');
  const [sending, setSending] = useState(false);

  const fetchCommunications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get<{ success: boolean; data: Communication[] }>('/communications');
      setCommunications(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al cargar las comunicaciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunications();
  }, [fetchCommunications]);

  // Cargar destinatarios cuando se abre el modal
  const handleOpenCompose = async () => {
    setIsComposeOpen(true);
    setLoadingRecipients(true);
    setComposeError('');
    try {
      const res = await apiClient.get<{ data: { users: UserSummary[] } | UserSummary[] }>('/users');
      // A veces la API retorna { data: { users: [...] } } o { data: [...] }
      const allUsers = Array.isArray(res.data) 
        ? res.data 
        : (res.data as any).data?.users ?? (res.data as any).users ?? [];
      
      // Filtrar destinatarios lógicos:
      // - Si soy PADRE, puedo enviar a DOCENTES y ADMINS del colegio.
      // - Si soy DOCENTE, puedo enviar a PADRES y ADMINS.
      // - Si soy ADMIN, puedo enviar a todos.
      const filtered = allUsers.filter((u: UserSummary) => {
        if (u.id === user?.id) return false;
        if (user?.role === 'PARENT') {
          return u.role === 'TEACHER' || u.role === 'SCHOOL_ADMIN';
        }
        if (user?.role === 'TEACHER') {
          return u.role === 'PARENT' || u.role === 'SCHOOL_ADMIN';
        }
        return true; // Administrador o Super Admin pueden escribir a todos
      });
      setRecipients(filtered);
    } catch (err) {
      console.error(err);
      setComposeError('No se pudieron cargar los contactos.');
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleExpandMessage = async (msg: Communication) => {
    if (expandedId === msg.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(msg.id);

    // Si soy el receptor y no está leído, marcar como leído
    if (msg.receiver.id === user?.id && !msg.is_read) {
      try {
        await apiClient.put(`/communications/${msg.id}/read`);
        // Actualizar localmente el estado de lectura
        setCommunications(prev =>
          prev.map(c => (c.id === msg.id ? { ...c, is_read: true } : c))
        );
      } catch (err) {
        console.error('Error al marcar como leído', err);
      }
    }
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
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
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => reject('Error al cargar la imagen');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject('Error al leer el archivo');
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImage(file, 800, 800);
      setAttachment(base64);
    } catch (err) {
      alert('Error al procesar el adjunto.');
    }
  };

  const handleSubmitCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId) {
      setComposeError('Selecciona un destinatario.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      setComposeError('Completa el asunto y el mensaje.');
      return;
    }

    setSending(true);
    setComposeError('');
    try {
      await apiClient.post('/communications', {
        title: title.trim(),
        body: body.trim(),
        receiver_id: receiverId,
        attachment_url: attachment || undefined,
      });

      setTitle('');
      setBody('');
      setReceiverId('');
      setAttachment('');
      setIsComposeOpen(false);
      await fetchCommunications();
    } catch (err: any) {
      setComposeError(err.response?.data?.error ?? 'Error al enviar el comunicado.');
    } finally {
      setSending(false);
    }
  };

  // Filtrar recibidos y enviados
  const inbox = communications.filter(c => c.receiver.id === user?.id);
  const outbox = communications.filter(c => c.sender.id === user?.id);
  const activeList = tab === 'inbox' ? inbox : outbox;

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <span className="nav-logo-dot" />CASPETE COMUNICACIONES
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
            🏠 Inicio
          </button>
          <button className="btn-ghost" onClick={() => navigate('/profile')}>
            Mi perfil
          </button>
          <button className="btn-ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="dashboard-body">
        {/* Encabezado */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn-ghost" onClick={() => navigate(-1)} style={{ padding: '6px 12px' }}>
              ← Volver
            </button>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Comunicaciones 📬</h1>
          </div>
          <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={handleOpenCompose}>
            ✏️ Nueva Nota / Excusa
          </button>
        </div>

        {/* Pestañas Bandejas */}
        <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--color-border)', marginBottom: 20 }}>
          <button
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'inbox' ? '2px solid var(--color-text)' : 'none',
              fontWeight: tab === 'inbox' ? 600 : 400,
              color: tab === 'inbox' ? 'var(--color-text)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: 14,
            }}
            onClick={() => setTab('inbox')}
          >
            📥 Recibidos ({inbox.length})
          </button>
          <button
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'outbox' ? '2px solid var(--color-text)' : 'none',
              fontWeight: tab === 'outbox' ? 600 : 400,
              color: tab === 'outbox' ? 'var(--color-text)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: 14,
            }}
            onClick={() => setTab('outbox')}
          >
            📤 Enviados ({outbox.length})
          </button>
        </div>

        {/* Listado de Comunicaciones */}
        {loading && <div className="roadmap-note">Cargando bandeja de comunicaciones...</div>}
        {error && <div className="form-error">{error}</div>}

        {!loading && !error && activeList.length === 0 && (
          <div className="roadmap-note" style={{ padding: 40 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Bandeja vacía</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              {tab === 'inbox' 
                ? 'No has recibido comunicados ni reportes escolares.' 
                : 'No has enviado ninguna nota o excusa todavía.'}
            </p>
          </div>
        )}

        {!loading && activeList.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeList.map((msg) => {
              const isExpanded = expandedId === msg.id;
              const dateStr = new Date(msg.created_at).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={msg.id}
                  className="user-card"
                  style={{
                    padding: '20px 24px',
                    marginBottom: 0,
                    cursor: 'pointer',
                    borderLeft: tab === 'inbox' && !msg.is_read 
                      ? '4px solid var(--color-brand)' 
                      : '1px solid var(--color-border)',
                    background: tab === 'inbox' && !msg.is_read ? 'rgba(24,226,153,0.03)' : '#fff',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => handleExpandMessage(msg)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 15 }}>{msg.title}</strong>
                        {tab === 'inbox' && !msg.is_read && (
                          <span className="role-badge" style={{ fontSize: 10, padding: '1px 6px', background: 'var(--color-brand)', color: '#0d0d0d' }}>
                            Nuevo
                          </span>
                        )}
                        {msg.attachment_url && <span style={{ fontSize: 12 }}>📎 Adjunto</span>}
                      </div>

                      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        {tab === 'inbox' 
                          ? `De: ${msg.sender.name} (${msg.sender.role === 'TEACHER' ? 'Docente' : 'Administrador'})` 
                          : `Para: ${msg.receiver.name} (${msg.receiver.role === 'TEACHER' ? 'Docente' : 'Acudiente'})`}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {dateStr}
                    </span>
                  </div>

                  {/* Cuerpo expandido */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: '1px solid var(--color-border)',
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: 'var(--color-text-secondary)'
                      }}
                      onClick={e => e.stopPropagation()} // Evita contraer el card al interactuar adentro
                    >
                      <p style={{ margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>{msg.body}</p>

                      {msg.attachment_url && (
                        <div style={{ background: 'var(--color-gray-100)', padding: '14px 16px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600 }}>📎 Archivo adjunto (Excusa / Comprobante)</p>
                          <img
                            src={msg.attachment_url}
                            alt="Adjunto de comunicación"
                            style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--color-border)' }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL COMPONER COMUNICADO */}
      {isComposeOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => !sending && setIsComposeOpen(false)}
        >
          <div
            className="user-card"
            style={{ maxWidth: 460, width: '100%', padding: '32px 28px', marginBottom: 0, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600 }}>Enviar Nueva Nota o Excusa</h2>

            <form onSubmit={handleSubmitCompose}>
              {/* Contacto / Destinatario */}
              <div className="form-group">
                <label className="form-label" htmlFor="compose-receiver">Destinatario</label>
                {loadingRecipients ? (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '10px 0' }}>Cargando contactos...</div>
                ) : (
                  <select
                    id="compose-receiver"
                    className="form-select"
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    disabled={sending}
                    required
                  >
                    <option value="">Selecciona un contacto...</option>
                    {recipients.map(r => {
                      let roleLabel = '';
                      if (r.role === 'TEACHER') roleLabel = 'Docente';
                      else if (r.role === 'SCHOOL_ADMIN') roleLabel = 'Administración';
                      else if (r.role === 'PARENT') roleLabel = 'Acudiente';
                      else roleLabel = r.role;

                      return (
                        <option key={r.id} value={r.id}>
                          {r.name} ({roleLabel})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Asunto */}
              <div className="form-group">
                <label className="form-label" htmlFor="compose-title">Asunto / Título</label>
                <input
                  id="compose-title"
                  className="form-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Excusa Médica 29/05, Citación a Padre, Novedad Escolar"
                  disabled={sending}
                  required
                />
              </div>

              {/* Mensaje */}
              <div className="form-group">
                <label className="form-label" htmlFor="compose-body">Mensaje / Cuerpo</label>
                <textarea
                  id="compose-body"
                  className="form-input"
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Escribe el contenido detallado de tu comunicación aquí..."
                  disabled={sending}
                  required
                  style={{ borderRadius: 12, resize: 'none' }}
                />
              </div>

              {/* Adjunto Imagen */}
              <div style={{ background: 'rgba(24,226,153,0.06)', border: '1.5px solid rgba(24,226,153,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.5 }}>
                  📸 Opcional: puedes <strong>cargar una foto o comprobante</strong> (Ej: excusa médica).
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="form-input"
                  disabled={sending}
                  style={{ padding: '8px', fontSize: 13, cursor: 'pointer', marginBottom: 10 }}
                />
                {attachment && (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={attachment}
                      alt="Miniatura de adjunto"
                      style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--color-border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setAttachment('')}
                      style={{
                        position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff',
                        border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {composeError && <p className="form-error">{composeError}</p>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setIsComposeOpen(false)}
                  disabled={sending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, marginTop: 0 }}
                  disabled={sending}
                >
                  {sending ? 'Enviando...' : 'Enviar Comunicado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
