import { useEffect, useState } from 'react';
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

const TYPE_LABEL: Record<string, string> = {
  TOPUP: 'Recarga', CHARGE: 'Cobro', REFUND: 'Reembolso', ADJUSTMENT: 'Ajuste',
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

  useEffect(() => {
    if (!studentId) { setError('Falta student_id'); setLoading(false); return; }

    Promise.all([
      apiClient.get<{ data: Student }>(`/students/${studentId}`).then((r) => setStudent(r.data.data)),
      apiClient.get<{ data: Transaction[] }>(`/transactions?student_id=${studentId}`).then((r) => setTransactions(r.data.data)),
    ])
      .catch((e) => setError((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al cargar'))
      .finally(() => setLoading(false));
  }, [studentId]);

  const isParent = user?.role === 'PARENT';
  const backTo = isParent ? '/students' : '/students';

  if (loading) return <div className="auth-page"><div className="roadmap-note" style={{ maxWidth: 560, width: '100%' }}>Cargando...</div></div>;
  if (error) return <div className="auth-page"><p className="form-error" style={{ maxWidth: 560, width: '100%' }}>{error}</p></div>;

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="btn-ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </nav>

      <main className="dashboard-body">
        <Link to={backTo} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 24 }}>
          ← Volver a estudiantes
        </Link>

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

        <div style={{ marginBottom: 16 }}>
          <p className="dashboard-label">Historial</p>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.4px' }}>Movimientos de saldo</h2>
        </div>

        {transactions.length === 0 && (
          <div className="roadmap-note">No hay movimientos registrados.</div>
        )}

        {transactions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transactions.map((tx) => (
              <div key={tx.id} className="user-card" style={{ padding: '16px 20px', marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <span className="role-badge" style={{ ...TYPE_STYLE[tx.type], flexShrink: 0 }}>
                      {TYPE_LABEL[tx.type]}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {fmtDate(tx.created_at)}
                      </p>
                      {tx.order && (
                        <Link
                          to={`/orders/${tx.order.id}`}
                          style={{ fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'none' }}
                        >
                          Pedido del {new Date(tx.order.scheduled_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{
                      margin: '0 0 2px',
                      fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)',
                      color: tx.type === 'TOPUP' || tx.type === 'REFUND' ? 'var(--color-brand-deep)' : 'var(--color-text)',
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
      </main>
    </>
  );
}
