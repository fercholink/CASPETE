import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface Transaction {
  id: string;
  type: 'TOPUP' | 'CHARGE' | 'REFUND' | 'ADJUSTMENT';
  amount: string;
  balance_after: string;
  payment_method: string | null;
  created_at: string;
  order: { id: string; scheduled_date: string; total_amount: string } | null;
}

interface Student {
  id: string;
  full_name: string;
  grade: string | null;
  balance: string;
  school: { name: string };
}

interface TxStats {
  total: number; topups: number; charges: number; refunds: number;
  totalTopup: string; totalCharge: string;
}

const TYPE_LABEL: Record<string, string> = {
  TOPUP: 'Recarga', CHARGE: 'Cobro', REFUND: 'Reembolso', ADJUSTMENT: 'Ajuste',
};
const TYPE_ICON: Record<string, string> = {
  TOPUP: '💰', CHARGE: '🛒', REFUND: '↩️', ADJUSTMENT: '⚙️',
};
const TYPE_STYLE: Record<string, React.CSSProperties> = {
  TOPUP:      { background: 'var(--color-brand-light)', color: 'var(--color-brand-deep)' },
  CHARGE:     { background: 'rgba(195,125,13,0.1)', color: '#c37d0d' },
  REFUND:     { background: 'rgba(55,114,207,0.1)', color: '#3772cf' },
  ADJUSTMENT: { background: 'var(--color-gray-100)', color: 'var(--color-text-muted)' },
};

function fmt(v: string) {
  return `$${parseFloat(v).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TransactionsPage() {
  const [params] = useSearchParams();
  const studentId = params.get('student_id') ?? '';
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [stats, setStats] = useState<TxStats | null>(null);

  const fetchTx = useCallback((pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set('student_id', studentId); p.set('page', String(pg)); p.set('limit', '30');
    if (typeFilter) p.set('type', typeFilter);
    apiClient.get<{ data: { transactions: Transaction[]; total: number; page: number; pages: number } }>(`/transactions?${p}`)
      .then(r => { setTransactions(r.data.data.transactions); setTotalPages(r.data.data.pages); setError(''); })
      .catch(e => setError((e as any).response?.data?.error ?? 'Error al cargar'))
      .finally(() => setLoading(false));
  }, [studentId, typeFilter]);

  useEffect(() => {
    if (!studentId) { setError('Falta student_id'); setLoading(false); return; }
    apiClient.get<{ data: Student }>(`/students/${studentId}`).then(r => setStudent(r.data.data)).catch(() => {});
    apiClient.get<{ data: TxStats }>(`/transactions/stats?student_id=${studentId}`).then(r => setStats(r.data.data)).catch(() => {});
  }, [studentId]);

  useEffect(() => { if (studentId) fetchTx(page); }, [fetchTx, page, studentId]);

  const isParent = user?.role === 'PARENT';

  if (!studentId) return <div className="auth-page"><p className="form-error" style={{ maxWidth: 560 }}>Falta student_id en la URL</p></div>;

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
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
        <Link to="/students" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 20 }}>
          ← Volver a estudiantes
        </Link>

        {/* Student header card */}
        {student && (
          <div className="user-card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.44px' }}>
                  {student.full_name}
                  {student.grade && <span style={{ fontWeight: 400, fontSize: 15, color: 'var(--color-text-muted)', marginLeft: 8 }}>{student.grade}</span>}
                </h1>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>{student.school.name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 2px', fontSize: 12, color: 'var(--color-text-muted)' }}>Saldo actual</p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-brand-deep)', letterSpacing: '-0.5px' }}>
                  {fmt(student.balance)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Total recargas', value: fmt(stats.totalTopup), sub: `${stats.topups} mov.`, icon: '💰', color: '#059669' },
              { label: 'Total cobros', value: fmt(stats.totalCharge), sub: `${stats.charges} mov.`, icon: '🛒', color: '#c37d0d' },
              { label: 'Reembolsos', value: stats.refunds, sub: 'movimientos', icon: '↩️', color: '#3772cf' },
              { label: 'Movimientos', value: stats.total, sub: 'total', icon: '📊', color: '#6366f1' },
            ].map(s => (
              <div key={s.label} className="user-card" style={{ padding: '12px 14px', marginBottom: 0, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 18 }}>{s.icon}</p>
                <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, flex: 1 }}>Movimientos</h2>
          <select className="form-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} style={{ width: 150, marginBottom: 0 }}>
            <option value="">Todos</option>
            <option value="TOPUP">Recargas</option>
            <option value="CHARGE">Cobros</option>
            <option value="REFUND">Reembolsos</option>
            <option value="ADJUSTMENT">Ajustes</option>
          </select>
        </div>

        {loading && <div className="roadmap-note">Cargando movimientos...</div>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && transactions.length === 0 && (
          <div className="roadmap-note">No hay movimientos{typeFilter ? ' con este filtro' : ''}.</div>
        )}

        {!loading && transactions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transactions.map((tx) => (
              <div key={tx.id} className="user-card" style={{ padding: '14px 18px', marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{TYPE_ICON[tx.type]}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="role-badge" style={{ ...TYPE_STYLE[tx.type], fontSize: 11 }}>{TYPE_LABEL[tx.type]}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{fmtDate(tx.created_at)}</span>
                      </div>
                      {tx.order && (
                        <Link to={`/orders/${tx.order.id}`} style={{ fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'none' }}>
                          Pedido del {new Date(tx.order.scheduled_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{
                      margin: '0 0 2px', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)',
                      color: tx.type === 'TOPUP' || tx.type === 'REFUND' ? '#059669' : '#c37d0d',
                    }}>
                      {tx.type === 'TOPUP' || tx.type === 'REFUND' ? '+' : '−'}{fmt(tx.amount)}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Saldo: {fmt(tx.balance_after)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 20 }}>
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: 13, padding: '6px 14px' }}>← Anterior</button>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{page} / {totalPages}</span>
            <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ fontSize: 13, padding: '6px 14px' }}>Siguiente →</button>
          </div>
        )}
      </main>
    </>
  );
}
