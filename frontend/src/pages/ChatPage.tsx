import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL ?? '';
const POLL_INTERVAL_MS = 5000;

interface Sender {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

interface ChatMsg {
  id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender: Sender;
}

interface ChatThread {
  id: string;
  subject: string;
  status: 'OPEN' | 'CLOSED' | 'RESOLVED';
  created_at: string;
  updated_at: string;
  order_id: string | null;
  vendor: Sender;
  parent: Sender;
  order: { id: string; scheduled_date: string; total_amount: number; status: string } | null;
  messages: ChatMsg[];
  unread_count: number;
}

export default function ChatPage() {
  const ctx = useContext(AuthContext);
  const user = ctx?.user ?? null;
  const navigate = useNavigate();
  const { threadId } = useParams<{ threadId?: string }>();

  const token = localStorage.getItem('caspete_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── Estado ────────────────────────────────────────────────────────────────
  const [threads, setThreads] = useState<(ChatThread & { last_message?: { content: string; created_at: string } | null })[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch lista de hilos ──────────────────────────────────────────────────
  const fetchThreads = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API}/api/chat/threads`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json() as { success: boolean; data: typeof threads };
      if (json.success) setThreads(json.data);
    } finally { setLoadingList(false); }
  }, [token]);

  // ── Fetch hilo activo (polling) ───────────────────────────────────────────
  const fetchThread = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API}/api/chat/threads/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json() as { success: boolean; data: ChatThread };
      if (json.success) {
        setActiveThread(json.data);
        // Marcar como leídos
        fetch(`${API}/api/chat/threads/${id}/read`, {
          method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } catch { /* silencioso en polling */ }
  }, [token]);

  // ── Inicialización ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    void fetchThreads();
  }, [fetchThreads, user]);

  // ── Abrir hilo desde URL param ────────────────────────────────────────────
  useEffect(() => {
    if (threadId) {
      setLoadingThread(true);
      fetchThread(threadId).finally(() => setLoadingThread(false));
    }
  }, [threadId, fetchThread]);

  // ── Polling del hilo activo ───────────────────────────────────────────────
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activeThread) return;

    pollRef.current = setInterval(() => {
      void fetchThread(activeThread.id);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeThread?.id, fetchThread]);

  // ── Scroll al último mensaje ──────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length]);

  // ── Seleccionar hilo ──────────────────────────────────────────────────────
  function openThread(thread: ChatThread) {
    setLoadingThread(true);
    fetchThread(thread.id).finally(() => setLoadingThread(false));
    navigate(`/chat/${thread.id}`, { replace: true });
  }

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThread || !msgText.trim()) return;
    setSending(true); setError('');
    try {
      const res = await fetch(`${API}/api/chat/threads/${activeThread.id}/messages`, {
        method: 'POST', headers,
        body: JSON.stringify({ content: msgText.trim() }),
      });
      const json = await res.json() as { success: boolean; message?: string };
      if (!json.success) throw new Error(json.message ?? 'Error al enviar');
      setMsgText('');
      await fetchThread(activeThread.id);
      await fetchThreads();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar mensaje');
    } finally { setSending(false); }
  }

  // ── Cerrar hilo ───────────────────────────────────────────────────────────
  async function closeThread(status: 'CLOSED' | 'RESOLVED') {
    if (!activeThread) return;
    await fetch(`${API}/api/chat/threads/${activeThread.id}/close`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ status }),
    });
    await fetchThread(activeThread.id);
    await fetchThreads();
  }

  const isVendor = user?.role === 'VENDOR';
  const isClosed = activeThread?.status !== 'OPEN';
  const otherParty = activeThread
    ? (user?.id === activeThread.vendor.id ? activeThread.parent : activeThread.vendor)
    : null;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: 'var(--color-bg)', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Sidebar: lista de hilos ────────────────────────────────── */}
      <div style={{
        width: 320, minWidth: 220, borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column', background: 'var(--color-surface)',
      }}>
        {/* Header sidebar */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/dashboard')} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 13 }}>←</button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>💬 Mensajes</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{threads.length} conversaciones</div>
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingList && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</div>
          )}
          {!loadingList && threads.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
              {isVendor ? 'No tienes conversaciones.\nUsa el botón en un pedido\npara iniciar una.' : 'Sin mensajes del tendero aún.'}
            </div>
          )}
          {threads.map((t) => {
            const isActive = activeThread?.id === t.id;
            const unread = (t as { _count?: { messages: number } })._count?.messages ?? 0;
            const other = user?.id === t.vendor.id ? t.parent : t.vendor;
            return (
              <button key={t.id} onClick={() => openThread(t)}
                style={{
                  width: '100%', textAlign: 'left', padding: '14px 18px',
                  borderBottom: '1px solid var(--color-border)',
                  background: isActive ? 'var(--color-brand-alpha, #6366f110)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderLeft: isActive ? '3px solid var(--color-brand)' : '3px solid transparent',
                  transition: 'all .15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>{other.full_name}</span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    {new Date(t.updated_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 3, fontWeight: 500 }}>{t.subject}</div>
                {t.last_message && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                    {t.last_message.content}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 20, fontWeight: 600,
                    background: t.status === 'OPEN' ? '#dcfce7' : '#f1f5f9',
                    color: t.status === 'OPEN' ? '#16a34a' : '#6b7280',
                  }}>{t.status}</span>
                  {unread > 0 && (
                    <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: 'var(--color-brand)', color: '#fff', fontWeight: 700 }}>{unread}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Área de mensajes ──────────────────────────────────────── */}
      {!activeThread && !loadingThread ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 15, fontWeight: 500 }}>Selecciona una conversación</p>
            {isVendor && <p style={{ fontSize: 13, marginTop: 8 }}>O inicia una desde el detalle de un pedido.</p>}
          </div>
        </div>
      ) : loadingThread ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>Cargando conversación...</div>
      ) : activeThread && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header conversación */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{otherParty?.full_name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {activeThread.subject}
                {activeThread.order && (
                  <span style={{ marginLeft: 8, color: 'var(--color-brand)', cursor: 'pointer' }}
                    onClick={() => navigate(`/orders/${activeThread.order!.id}`)}>
                    · Ver pedido ↗
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                background: activeThread.status === 'OPEN' ? '#dcfce7' : '#f1f5f9',
                color: activeThread.status === 'OPEN' ? '#16a34a' : '#6b7280',
              }}>{activeThread.status}</span>
              {!isClosed && (isVendor || user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <>
                  <button onClick={() => closeThread('RESOLVED')} className="btn-ghost"
                    style={{ padding: '4px 12px', fontSize: 12, color: '#16a34a' }}>
                    ✅ Resolver
                  </button>
                  <button onClick={() => closeThread('CLOSED')} className="btn-ghost"
                    style={{ padding: '4px 12px', fontSize: 12, color: '#dc2626' }}>
                    🔒 Cerrar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeThread.messages.map((msg) => {
              const isMine = msg.sender.id === user?.id;
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  {!isMine && (
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', background: 'var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: 'var(--color-brand)', marginRight: 8, flexShrink: 0,
                    }}>
                      {msg.sender.full_name.charAt(0)}
                    </div>
                  )}
                  <div style={{ maxWidth: '70%' }}>
                    {!isMine && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>{msg.sender.full_name}</div>
                    )}
                    <div style={{
                      padding: '10px 14px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMine ? 'var(--color-brand)' : 'var(--color-surface)',
                      border: isMine ? 'none' : '1px solid var(--color-border)',
                      color: isMine ? '#fff' : 'var(--color-text)',
                      fontSize: 14, lineHeight: 1.5,
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3, textAlign: isMine ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      {isMine && msg.read_at && <span style={{ marginLeft: 4 }}>✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input de mensaje */}
          {isClosed ? (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
              🔒 Conversación cerrada
            </div>
          ) : (
            <form onSubmit={sendMessage} style={{
              padding: '12px 20px', borderTop: '1px solid var(--color-border)',
              background: 'var(--color-surface)', display: 'flex', gap: 10, alignItems: 'flex-end',
            }}>
              <div style={{ flex: 1 }}>
                {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 6 }}>{error}</p>}
                <textarea
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(e as unknown as React.FormEvent); } }}
                  placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
                  rows={2}
                  maxLength={1000}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 12,
                    border: '1px solid var(--color-border)', fontSize: 14,
                    resize: 'none', boxSizing: 'border-box',
                    background: 'var(--color-bg)', color: 'var(--color-text)',
                    outline: 'none',
                  }}
                />
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right', marginTop: 2 }}>{msgText.length}/1000</div>
              </div>
              <button type="submit" disabled={sending || !msgText.trim()} className="btn-primary"
                style={{ padding: '10px 20px', fontSize: 14, borderRadius: 12, flexShrink: 0 }}>
                {sending ? '...' : '➤ Enviar'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
