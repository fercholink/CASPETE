import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Lead {
  id: string;
  school_name: string;
  nit: string | null;
  city: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  students_count: number | null;
  plan_interest: 'COMMISSION' | 'MONTHLY';
  message: string | null;
  status: 'NEW' | 'CONTACTED' | 'DEMO' | 'CLOSED';
  notes: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = { NEW: 'Nuevo', CONTACTED: 'Contactado', DEMO: 'Demo agendada', CLOSED: 'Cerrado' };
const STATUS_COLOR: Record<string, React.CSSProperties> = {
  NEW:       { background: 'rgba(24,226,153,0.1)', color: '#16a34a' },
  CONTACTED: { background: 'rgba(59,130,246,0.1)', color: '#2563eb' },
  DEMO:      { background: 'rgba(168,85,247,0.1)', color: '#7c3aed' },
  CLOSED:    { background: 'rgba(107,114,128,0.1)', color: '#6b7280' },
};
const PLAN_LABEL: Record<string, string> = { COMMISSION: 'Por Comisión', MONTHLY: 'Mensual' };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SchoolLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchLeads() {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      const r = await apiClient.get<{ leads: Lead[]; total: number }>(`/leads${qs}`);
      setLeads(r.data.leads);
      setTotal(r.data.total);
    } finally { setLoading(false); }
  }

  useEffect(() => { void fetchLeads(); }, [statusFilter]);

  function openDetail(lead: Lead) {
    setSelected(lead);
    setNotes(lead.notes ?? '');
    setNewStatus(lead.status);
  }

  async function saveLead() {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.patch(`/leads/${selected.id}`, { status: newStatus, notes });
      await fetchLeads();
      setSelected(null);
    } finally { setSaving(false); }
  }

  const counts = leads.reduce<Record<string, number>>((acc, l) => { acc[l.status] = (acc[l.status] ?? 0) + 1; return acc; }, {});

  return (
    <div className="auth-page" style={{ justifyContent: 'flex-start', paddingTop: 40, alignItems: 'stretch', padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, width: '100%', margin: '0 auto' }}>

        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 24 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al dashboard
        </Link>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>🏫 Colegios Interesados</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>
            {total} solicitud{total !== 1 ? 'es' : ''} recibida{total !== 1 ? 's' : ''} desde la landing page
          </p>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {Object.entries(STATUS_LABEL).map(([k, label]) => (
            <div key={k} style={{ padding: '12px 20px', borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', outline: statusFilter === k ? '2px solid var(--color-brand)' : 'none' }}
              onClick={() => setStatusFilter(statusFilter === k ? '' : k)}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>{counts[k] ?? 0}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando...</p>
        ) : leads.length === 0 ? (
          <div className="user-card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No hay solicitudes{statusFilter ? ' con este estado' : ''}.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leads.map(lead => (
              <div key={lead.id} className="user-card" style={{ cursor: 'pointer', transition: 'box-shadow .15s' }}
                onClick={() => openDetail(lead)}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = ''}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{lead.school_name}</span>
                      <span className="role-badge" style={STATUS_COLOR[lead.status]}>{STATUS_LABEL[lead.status]}</span>
                      <span className="role-badge" style={{ background: 'rgba(26,71,49,0.08)', color: '#1a4731' }}>{PLAN_LABEL[lead.plan_interest]}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {lead.city} · {lead.contact_name} · {lead.contact_email}
                      {lead.students_count ? ` · ${lead.students_count} estudiantes` : ''}
                    </p>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(lead.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Drawer de detalle / edición ── */}
      {selected && (
        <div onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: 480, height: '100%', overflowY: 'auto', padding: 32, boxShadow: '-8px 0 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Detalle del lead</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {([
                ['Colegio', selected.school_name],
                ['NIT', selected.nit ?? '—'],
                ['Ciudad', selected.city],
                ['Modalidad', PLAN_LABEL[selected.plan_interest]],
                ['Contacto', selected.contact_name],
                ['Email', selected.contact_email],
                ['Teléfono', selected.contact_phone ?? '—'],
                ['Estudiantes', selected.students_count?.toString() ?? '—'],
                ['Recibido', fmtDate(selected.created_at)],
              ] as [string, string][]).map(([label, val]) => (
                <div key={label} style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                  <span style={{ fontWeight: 600, minWidth: 90, color: 'var(--color-text-muted)' }}>{label}</span>
                  <span style={{ color: 'var(--color-text)' }}>{val}</span>
                </div>
              ))}
              {selected.message && (
                <div style={{ marginTop: 8, padding: 14, background: 'var(--color-bg)', borderRadius: 10, fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                  "{selected.message}"
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--color-text-muted)' }}>Estado</label>
              <select className="form-input" value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ fontSize: 14 }}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--color-text-muted)' }}>Notas internas</label>
              <textarea className="form-input" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Llamar el lunes, piden demo el jueves..." style={{ fontSize: 14, resize: 'vertical' }} />
            </div>

            <button className="btn-primary" disabled={saving} onClick={saveLead} style={{ width: '100%' }}>
              {saving ? 'Guardando...' : '💾 Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
