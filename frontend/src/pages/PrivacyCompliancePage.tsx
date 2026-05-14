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

export default function PrivacyCompliancePage() {
  const ctx = useContext(AuthContext);
  const user = ctx?.user ?? null;
  const navigate = useNavigate();

  const [tab, setTab] = useState<'audit' | 'arco'>('audit');
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [arcoList, setArcoList] = useState<ArcoRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') { navigate('/no-autorizado'); return; }
    if (tab === 'audit') fetchAuditLogs();
    else fetchArcoRequests();
  }, [tab, fetchAuditLogs, fetchArcoRequests, user, navigate]);

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
        {(['audit', 'arco'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer',
              background: 'none', fontWeight: tab === t ? 700 : 400,
              fontSize: 14, color: tab === t ? 'var(--color-brand)' : 'var(--color-text-muted)',
              borderBottom: tab === t ? '2px solid var(--color-brand)' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {t === 'audit' ? '📋 Audit Log' : '📝 Solicitudes ARCO'}
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
    </div>
  );
}
