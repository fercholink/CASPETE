import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

interface TopupRequest {
  id: string;
  amount: string;
  receipt_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  student: { full_name: string };
  parent: { full_name: string; email: string };
  school?: { name: string };
}

export default function TopupRequestsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: TopupRequest[] }>('/topup-requests');
      setRequests(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleProcess(id: string, action: 'APPROVED' | 'REJECTED') {
    if (!confirm(`¿Estás seguro de que quieres ${action === 'APPROVED' ? 'APROBAR' : 'RECHAZAR'} esta recarga?`)) return;
    try {
      await apiClient.post(`/topup-requests/${id}/process`, { action });
      alert('Procesado exitosamente');
      fetchRequests();
    } catch (err) {
      alert('Error al procesar la solicitud');
    }
  }

  return (
    <>
      <nav className="dashboard-nav">
        <span className="nav-logo"><span className="nav-logo-dot" />CASPETE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="desktop-only">Inicio</span>
          </button>
          <button className="btn-ghost" onClick={logout}>
            <span className="desktop-only">Cerrar sesión</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-body">
        <div style={{ marginBottom: 32 }}>
          <p className="dashboard-label">Finanzas</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.56px' }}>Solicitudes de Recarga</h1>
        </div>

        {loading ? (
          <div className="roadmap-note">Cargando solicitudes...</div>
        ) : requests.length === 0 ? (
          <div className="roadmap-note">No hay solicitudes de recarga.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {requests.map(req => (
              <div key={req.id} className="user-card" style={{ padding: '20px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <a href={req.receipt_url} target="_blank" rel="noreferrer">
                  <img src={req.receipt_url} alt="Comprobante" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }} />
                </a>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px' }}>${parseFloat(req.amount).toLocaleString('es-CO')}</h3>
                  <p style={{ margin: '0 0 4px', fontSize: 14 }}><strong>Estudiante:</strong> {req.student.full_name}</p>
                  <p style={{ margin: '0 0 4px', fontSize: 14 }}><strong>Padre:</strong> {req.parent.full_name} ({req.parent.email})</p>
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-text-muted)' }}>Fecha: {new Date(req.created_at).toLocaleString()}</p>
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span className="role-badge" style={{ alignSelf: 'flex-start', background: req.status === 'PENDING' ? '#fef3c7' : req.status === 'APPROVED' ? '#d1fae5' : '#fee2e2', color: req.status === 'PENDING' ? '#92400e' : req.status === 'APPROVED' ? '#065f46' : '#991b1b' }}>
                      {req.status}
                    </span>
                    {req.status === 'PENDING' && user?.role !== 'PARENT' && (
                      <>
                        <button className="btn-primary" style={{ padding: '4px 12px', fontSize: 13, minHeight: 'auto', width: 'auto' }} onClick={() => handleProcess(req.id, 'APPROVED')}>✅ Aprobar</button>
                        <button className="btn-ghost" style={{ padding: '4px 12px', fontSize: 13, minHeight: 'auto', color: 'red' }} onClick={() => handleProcess(req.id, 'REJECTED')}>❌ Rechazar</button>
                      </>
                    )}
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
