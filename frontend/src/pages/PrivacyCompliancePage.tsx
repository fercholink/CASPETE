import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL ?? '';

interface AuditEntry {
  id: string;
  user_id: string | null;
  role: string | null;
  action: string;
  entity: string;
  record_id: string | null;
  fields: string[];
  ip_address: string | null;
  justification: string | null;
  created_at: string;
  user?: { full_name: string; email: string; role: string } | null;
}

interface ArcoRequest {
  id: string;
  user_id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  user?: { full_name: string; email: string; role: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE:    '#16a34a',
  READ:      '#2563eb',
  UPDATE:    '#d97706',
  DELETE:    '#dc2626',
  ANONYMIZE: '#7c3aed',
  EXPORT:    '#0891b2',
};

const ARCO_STATUS_COLORS: Record<string, string> = {
  PENDING:   '#d97706',
  RESOLVED:  '#16a34a',
  REJECTED:  '#dc2626',
};

const SEV_COLORS: Record<string, string> = {
  LOW:      '#6b7280',
  MEDIUM:   '#d97706',
  HIGH:     '#dc2626',
  CRITICAL: '#7c3aed',
};

interface BreachEntry {
  id: string;
  detected_at: string;
  reported_by: string;
  description: string;
  severity: string;
  status: string;
  sic_notification_deadline: string;
  days_until_sic_deadline: number;
  overdue: boolean;
  estimated_affected_users: number;
  remediation_actions: string;
}

interface ArcoAlert {
  id: string;
  user_id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  days_elapsed: number;
  legal_deadline_passed: boolean;
}

export default function PrivacyCompliancePage() {
  const ctx = useContext(AuthContext);
  const user = ctx?.user ?? null;
  const navigate = useNavigate();

  const [tab, setTab] = useState<'audit' | 'arco' | 'breaches'>('audit');
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [arcoList, setArcoList] = useState<ArcoRequest[]>([]);
  const [breaches, setBreaches] = useState<BreachEntry[]>([]);
  const [arcoAlerts, setArcoAlerts] = useState<{ overdue: ArcoAlert[]; pending_total: number; overdue_count: number }>({ overdue: [], pending_total: 0, overdue_count: 0 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  // Form nueva brecha
  const [breachForm, setBreachForm] = useState({ description: '', severity: 'HIGH', estimatedAffectedUsers: 0, affectedData: '', remediationActions: '' });
  const [breachSaving, setBreachSaving] = useState(false);
  const [breachSuccess, setBreachSuccess] = useState('');

  // Filtros audit
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const token = localStorage.getItem('caspete_token');

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filterAction) params.set('action', filterAction);
      if (filterEntity) params.set('entity', filterEntity);
      const res = await fetch(`${API}/api/arco/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json() as { success: boolean; data: AuditEntry[]; total: number; totalPages: number };
      if (json.success) { setLogs(json.data); setTotal(json.total); setTotalPages(json.totalPages); }
    } finally { setLoading(false); }
  }, [page, filterAction, filterEntity, token]);

  const fetchArcoRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/arco/arco-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json() as { success: boolean; data: ArcoRequest[] };
      if (json.success) setArcoList(json.data);
    } finally { setLoading(false); }
  }, [token]);

  const fetchBreaches = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, aRes] = await Promise.all([
        fetch(`${API}/api/arco/breaches`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/arco/arco-alerts`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const bJson = await bRes.json() as { success: boolean; data: BreachEntry[] };
      const aJson = await aRes.json() as { success: boolean; data: { overdue: ArcoAlert[]; pending_total: number; overdue_count: number } };
      if (bJson.success) setBreaches(bJson.data);
      if (aJson.success) setArcoAlerts(aJson.data);
    } finally { setLoading(false); }
  }, [token]);

  async function submitBreach(e: React.FormEvent) {
    e.preventDefault();
    setBreachSaving(true); setBreachSuccess('');
    try {
      const res = await fetch(`${API}/api/arco/breaches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          description: breachForm.description,
          severity: breachForm.severity,
          estimatedAffectedUsers: Number(breachForm.estimatedAffectedUsers),
          affectedData: breachForm.affectedData.split(',').map(s => s.trim()).filter(Boolean),
          remediationActions: breachForm.remediationActions,
        }),
      });
      const json = await res.json() as { success: boolean; data: { sic_notification_deadline: string } };
      if (json.success) {
        setBreachSuccess(`✅ Brecha registrada. Plazo SIC: ${new Date(json.data.sic_notification_deadline).toLocaleDateString('es-CO')}`);
        setBreachForm({ description: '', severity: 'HIGH', estimatedAffectedUsers: 0, affectedData: '', remediationActions: '' });
        void fetchBreaches();
      }
    } finally { setBreachSaving(false); }
  }

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') { navigate('/no-autorizado'); return; }
    if (tab === 'audit') fetchAuditLogs();
    else if (tab === 'arco') fetchArcoRequests();
    else fetchBreaches();
  }, [tab, fetchAuditLogs, fetchArcoRequests, fetchBreaches, user, navigate]);

  const cookieCount = logs.filter(l => l.entity === 'CookieConsent' || l.justification?.startsWith('Cookie consent')).length;
  const arcoCount   = arcoList.filter(r => r.status === 'PENDING').length;

  // ── Exportar como CSV ──────────────────────────────────────────────────────
  function downloadReport() {
    const now = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    let csv = '';
    let filename = '';

    if (tab === 'audit') {
      filename = `caspete_audit_log_${now}.csv`;
      const headers = ['ID','Fecha','Acción','Entidad','Usuario','Email','Rol','IP','Campos','Justificación'];
      csv = headers.join(';') + '\n';
      csv += logs.map(l => [
        l.id,
        new Date(l.created_at).toLocaleString('es-CO'),
        l.action,
        l.entity,
        l.user?.full_name ?? (l.role === 'ANONYMOUS' ? 'Anónimo' : l.user_id ?? ''),
        l.user?.email ?? '',
        l.role ?? '',
        l.ip_address ?? '',
        l.fields.join(' | '),
        (l.justification ?? '').replace(/;/g, ','),
      ].map(v => `"${String(v).replace(/"/g, '\'')}"`).join(';')).join('\n');
    } else {
      filename = `caspete_arco_requests_${now}.csv`;
      const headers = ['ID','Fecha','Tipo','Usuario','Email','Rol','Descripción','Estado','Fecha Resolución'];
      csv = headers.join(';') + '\n';
      csv += arcoList.map(r => [
        r.id,
        new Date(r.created_at).toLocaleString('es-CO'),
        r.type,
        r.user?.full_name ?? r.user_id,
        r.user?.email ?? '',
        r.user?.role ?? '',
        r.description.replace(/;/g, ','),
        r.status,
        r.resolved_at ? new Date(r.resolved_at).toLocaleString('es-CO') : '',
      ].map(v => `"${String(v).replace(/"/g, '\'')}"`).join(';')).join('\n');
    }

    // BOM para que Excel abra correctamente caracteres especiales
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-ghost"
            style={{ padding: '7px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← Panel principal
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
              🔐 Privacidad &amp; Compliance
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '3px 0 0' }}>
              Trazabilidad de datos personales — Ley 1581/2012 · Solo SUPER_ADMIN
            </p>
          </div>
          <button
            onClick={downloadReport}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}
          >
            ⬇ Descargar informe CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total registros audit', value: total, icon: '📋', color: '#2563eb' },
          { label: 'Consentimientos cookies', value: cookieCount, icon: '🍪', color: '#16a34a' },
          { label: 'Solicitudes ARCO', value: arcoList.length, icon: '📝', color: '#7c3aed' },
          { label: 'ARCO pendientes', value: arcoCount, icon: '⏳', color: '#d97706' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 12, padding: '18px 20px',
            borderLeft: `4px solid ${k.color}`,
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--color-border)' }}>
        {(['audit', 'arco', 'breaches'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer',
              background: 'none', fontWeight: tab === t ? 700 : 400,
              fontSize: 14, color: tab === t ? 'var(--color-brand)' : 'var(--color-text-muted)',
              borderBottom: tab === t ? '2px solid var(--color-brand)' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {t === 'audit' ? '📋 Audit Log' : t === 'arco' ? '📝 Solicitudes ARCO' : '🚨 Brechas & Alertas'}
          </button>
        ))}
      </div>

      {/* ── AUDIT TAB ─────────────────────────────────────────── */}
      {tab === 'audit' && (
        <>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-surface)' }}>
              <option value="">Todas las acciones</option>
              {['CREATE','READ','UPDATE','DELETE','ANONYMIZE','EXPORT'].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <input placeholder="Filtrar por entidad..." value={filterEntity}
              onChange={e => { setFilterEntity(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, minWidth: 200, background: 'var(--color-surface)' }} />
            <button onClick={fetchAuditLogs} className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>
              🔄 Actualizar
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Cargando...</div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--color-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-gray-50, #f9fafb)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Fecha', 'Acción', 'Entidad', 'Usuario', 'IP', 'Campos', 'Justificación'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'var(--color-gray-50, #fafafa)' }}>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                        {new Date(log.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11,
                          fontWeight: 700, color: '#fff',
                          background: ACTION_COLORS[log.action] ?? '#6b7280',
                        }}>{log.action}</span>
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 500 }}>{log.entity}</td>
                      <td style={{ padding: '9px 12px' }}>
                        {log.user ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>{log.user.full_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{log.user.email}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                            {log.role === 'ANONYMOUS' ? '👤 Anónimo' : log.user_id ? log.user_id.slice(0,8)+'…' : '—'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {log.ip_address ?? '—'}
                      </td>
                      <td style={{ padding: '9px 12px', maxWidth: 140 }}>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                          {log.fields.slice(0, 3).join(', ')}{log.fields.length > 3 ? ` +${log.fields.length-3}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '9px 12px', maxWidth: 240 }}>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={log.justification ?? ''}>
                          {log.justification ?? '—'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16, justifyContent: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>← Anterior</button>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Página {page} de {totalPages} · {total} registros</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>Siguiente →</button>
            </div>
          )}
        </>
      )}

      {/* ── ARCO TAB ──────────────────────────────────────────── */}
      {tab === 'arco' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Cargando...</div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--color-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-gray-50, #f9fafb)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Fecha', 'Tipo', 'Usuario', 'Descripción', 'Estado', 'Resuelto'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {arcoList.map((req, i) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'var(--color-gray-50, #fafafa)' }}>
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                      {new Date(req.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11,
                        fontWeight: 700, background: '#7c3aed20', color: '#7c3aed',
                      }}>{req.type}</span>
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      {req.user ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{req.user.full_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{req.user.email}</div>
                        </div>
                      ) : req.user_id.slice(0,8)+'…'}
                    </td>
                    <td style={{ padding: '9px 12px', maxWidth: 260, fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {req.description}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11,
                        fontWeight: 700, color: '#fff',
                        background: ARCO_STATUS_COLORS[req.status] ?? '#6b7280',
                      }}>{req.status}</span>
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {req.resolved_at ? new Date(req.resolved_at).toLocaleDateString('es-CO') : '—'}
                    </td>
                  </tr>
                ))}
                {arcoList.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>No hay solicitudes ARCO registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── BREACHES TAB ─────────────────────────────────────── */}
      {tab === 'breaches' && (
        loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Cargando...</div> : (
        <>
          {/* Alertas ARCO vencidas */}
          {arcoAlerts.overdue_count > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 14, color: '#dc2626' }}>
                ⚠️ {arcoAlerts.overdue_count} solicitud(es) ARCO llevan más de 10 días hábiles sin respuesta — Art. 13 Ley 1581/2012
              </p>
              {arcoAlerts.overdue.map(a => (
                <div key={a.id} style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 8, border: '1px solid #fca5a5' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{a.type}</span>
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#dc2626', fontWeight: 700 }}>{a.days_elapsed} días transcurridos</span>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>{a.description}</p>
                </div>
              ))}
            </div>
          )}
          {arcoAlerts.overdue_count === 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#16a34a' }}>✅ Todas las solicitudes ARCO están dentro del plazo legal (10 días hábiles). Pendientes: {arcoAlerts.pending_total}</p>
            </div>
          )}

          {/* Formulario nueva brecha */}
          <div style={{ background: 'var(--color-surface)', border: '2px solid #dc2626', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
            <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 15, color: '#dc2626' }}>
              🚨 Registrar Brecha de Seguridad — Art. 17 lit. f Ley 1581/2012
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--color-text-muted)' }}>
              Plazo para notificar a la SIC: <strong>15 días hábiles</strong> desde la detección. Este formulario genera el registro de trazabilidad.
            </p>
            <form onSubmit={submitBreach}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Severidad</label>
                  <select value={breachForm.severity} onChange={e => setBreachForm(f => ({ ...f, severity: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, background: SEV_COLORS[breachForm.severity] + '20', color: SEV_COLORS[breachForm.severity], fontWeight: 700 }}>
                    {['LOW','MEDIUM','HIGH','CRITICAL'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Usuarios afectados (estimado)</label>
                  <input type="number" min={0} value={breachForm.estimatedAffectedUsers}
                    onChange={e => setBreachForm(f => ({ ...f, estimatedAffectedUsers: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Descripción de la brecha *</label>
                <textarea required rows={3} value={breachForm.description} onChange={e => setBreachForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describa qué ocurrió, cómo se detectó y qué datos podrían estar comprometidos..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Datos afectados (separados por coma)</label>
                <input value={breachForm.affectedData} onChange={e => setBreachForm(f => ({ ...f, affectedData: e.target.value }))}
                  placeholder="email, contraseña, número de teléfono..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Acciones de remediación tomadas</label>
                <textarea rows={2} value={breachForm.remediationActions} onChange={e => setBreachForm(f => ({ ...f, remediationActions: e.target.value }))}
                  placeholder="Ej: se restablecieron contraseñas, se bloqueó el acceso al endpoint afectado..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              {breachSuccess && <p style={{ fontSize: 13, color: '#16a34a', marginBottom: 10 }}>{breachSuccess}</p>}
              <button type="submit" disabled={breachSaving} className="btn-primary" style={{ background: '#dc2626', fontSize: 13, padding: '8px 20px' }}>
                {breachSaving ? 'Registrando...' : '🚨 Registrar brecha'}
              </button>
            </form>
          </div>

          {/* Listado brechas anteriores */}
          {breaches.length > 0 && (
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Brechas registradas ({breaches.length})</p>
              {breaches.map(b => (
                <div key={b.id} style={{ background: 'var(--color-surface)', border: `1px solid ${b.overdue ? '#dc2626' : 'var(--color-border)'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#fff', background: SEV_COLORS[b.severity] ?? '#6b7280' }}>{b.severity}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{b.detected_at ? new Date(b.detected_at).toLocaleString('es-CO') : '—'}</span>
                    {b.overdue && <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>⚠ PLAZO SIC VENCIDO</span>}
                    {!b.overdue && b.days_until_sic_deadline >= 0 && <span style={{ fontSize: 11, color: '#d97706' }}>{b.days_until_sic_deadline} días para notificar SIC</span>}
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 500 }}>{b.description}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>Reportado por: {b.reported_by} · ~{b.estimated_affected_users} usuarios afectados</p>
                </div>
              ))}
            </div>
          )}
          {breaches.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: 14, textAlign: 'center', padding: 32 }}>No hay brechas de seguridad registradas. ✅</p>}
        </>
        )
      )}
    </div>
  );
}
