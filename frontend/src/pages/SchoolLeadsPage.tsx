import { useEffect, useMemo, useState } from 'react';
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

type NewLeadForm = {
  school_name: string; nit: string; city: string; contact_name: string; contact_email: string;
  contact_phone: string; students_count: string; plan_interest: 'COMMISSION' | 'MONTHLY'; message: string;
  contacted_at: string;
};

const STATUS_LABEL: Record<string, string> = { NEW: 'Nuevo', CONTACTED: 'Contactado', DEMO: 'Demo agendada', CLOSED: 'Cerrado' };
const STATUS_COLOR: Record<string, React.CSSProperties> = {
  NEW:       { background: 'rgba(24,226,153,0.1)', color: '#16a34a' },
  CONTACTED: { background: 'rgba(59,130,246,0.1)', color: '#2563eb' },
  DEMO:      { background: 'rgba(168,85,247,0.1)', color: '#7c3aed' },
  CLOSED:    { background: 'rgba(107,114,128,0.1)', color: '#6b7280' },
};
const PLAN_LABEL: Record<string, string> = { COMMISSION: 'Por Comisión', MONTHLY: 'Mensual' };

function nowForInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyForm(): NewLeadForm {
  return {
    school_name: '', nit: '', city: '', contact_name: '', contact_email: '',
    contact_phone: '', students_count: '', plan_interest: 'COMMISSION', message: '',
    contacted_at: nowForInput(),
  };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.startsWith('57') ? digits : `57${digits}`;
  return `https://wa.me/${withCountry}`;
}

export default function SchoolLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewLeadForm>(emptyForm());
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

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

  async function removeLead(id: string) {
    if (!confirm('¿Eliminar este lead? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/leads/${id}`);
      await fetchLeads();
      if (selected?.id === id) setSelected(null);
    } finally { setDeleting(false); }
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const { contacted_at, ...rest } = form;
      await apiClient.post('/leads/admin', {
        ...rest,
        nit: form.nit || undefined,
        contact_phone: form.contact_phone || undefined,
        students_count: form.students_count ? Number(form.students_count) : undefined,
        message: form.message || undefined,
        created_at: contacted_at ? new Date(contacted_at).toISOString() : undefined,
      });
      setShowCreate(false);
      setForm(emptyForm());
      await fetchLeads();
    } catch (err: unknown) {
      setCreateError((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al crear el lead');
    } finally {
      setCreating(false);
    }
  }

  const counts = leads.reduce<Record<string, number>>((acc, l) => { acc[l.status] = (acc[l.status] ?? 0) + 1; return acc; }, {});

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.trim().toLowerCase();
    return leads.filter(l =>
      l.school_name.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      l.contact_name.toLowerCase().includes(q) ||
      l.contact_email.toLowerCase().includes(q),
    );
  }, [leads, search]);

  return (
    <div className="auth-page" style={{ justifyContent: 'flex-start', paddingTop: 40, alignItems: 'stretch', padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, width: '100%', margin: '0 auto' }}>

        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 24 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al dashboard
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>🏫 Colegios Interesados</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>
              {total} solicitud{total !== 1 ? 'es' : ''} recibida{total !== 1 ? 's' : ''} desde la landing page
            </p>
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => { setForm(emptyForm()); setCreateError(''); setShowCreate(true); }}>
            + Nuevo lead
          </button>
        </div>

        {/* KPI strip / filtro por estado */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {Object.entries(STATUS_LABEL).map(([k, label]) => (
            <div key={k} style={{ padding: '12px 20px', borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', outline: statusFilter === k ? '2px solid var(--color-brand)' : 'none' }}
              onClick={() => setStatusFilter(statusFilter === k ? '' : k)}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>{counts[k] ?? 0}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        <input
          className="form-input" placeholder="Buscar por colegio, ciudad, contacto o email..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 20, fontSize: 14 }}
        />

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando...</p>
        ) : filteredLeads.length === 0 ? (
          <div className="user-card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
              {search ? 'Ningún lead coincide con la búsqueda.' : `No hay solicitudes${statusFilter ? ' con este estado' : ''}.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredLeads.map(lead => (
              <div key={lead.id} className="user-card" style={{ cursor: 'pointer', transition: 'box-shadow .15s' }}
                onClick={() => openDetail(lead)}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = ''}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{lead.school_name}</span>
                      <span className="role-badge" style={STATUS_COLOR[lead.status]}>{STATUS_LABEL[lead.status]}</span>
                      <span className="role-badge" style={{ background: 'rgba(26,71,49,0.08)', color: '#1a4731' }}>{PLAN_LABEL[lead.plan_interest]}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {lead.city} · {lead.contact_name} · {lead.contact_email}
                      {lead.students_count ? ` · ${lead.students_count} estudiantes` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {lead.contact_phone && (
                      <a
                        href={waLink(lead.contact_phone)} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        title="Escribir por WhatsApp"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', color: '#16a34a', textDecoration: 'none', fontSize: 15 }}
                      >
                        💬
                      </a>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); void removeLead(lead.id); }}
                      disabled={deleting}
                      title="Eliminar lead"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: 14 }}
                    >
                      🗑
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(lead.created_at)}</span>
                  </div>
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
              {selected.contact_phone && (
                <a href={waLink(selected.contact_phone)} target="_blank" rel="noreferrer" className="btn-ghost"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', fontSize: 13 }}>
                  💬 Escribir por WhatsApp
                </a>
              )}
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

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" disabled={saving} onClick={saveLead} style={{ flex: 1 }}>
                {saving ? 'Guardando...' : '💾 Guardar cambios'}
              </button>
              <button
                disabled={deleting}
                onClick={() => void removeLead(selected.id)}
                style={{ padding: '0 18px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#dc2626', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                🗑 Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: nuevo lead manual ── */}
      {showCreate && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="user-card" style={{ maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', marginBottom: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Registrar lead manualmente</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Para colegios contactados por llamada o WhatsApp que aún no llenaron el formulario público.
            </p>

            <form onSubmit={submitCreate}>
              <div className="form-group">
                <label className="form-label">Nombre del colegio *</label>
                <input className="form-input" required value={form.school_name} onChange={e => setForm(f => ({ ...f, school_name: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">NIT</label>
                  <input className="form-input" value={form.nit} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Ciudad *</label>
                  <input className="form-input" required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nombre del contacto *</label>
                <input className="form-input" required value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Correo *</label>
                  <input className="form-input" type="email" required value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Teléfono / WhatsApp</label>
                  <input className="form-input" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="3001234567" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">N° de estudiantes</label>
                  <input className="form-input" type="number" min={1} value={form.students_count} onChange={e => setForm(f => ({ ...f, students_count: e.target.value }))} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Modalidad de interés *</label>
                  <select className="form-input" value={form.plan_interest} onChange={e => setForm(f => ({ ...f, plan_interest: e.target.value as 'COMMISSION' | 'MONTHLY' }))}>
                    <option value="COMMISSION">Por Comisión</option>
                    <option value="MONTHLY">Mensual</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha y hora del contacto *</label>
                <input className="form-input" type="datetime-local" required value={form.contacted_at} onChange={e => setForm(f => ({ ...f, contacted_at: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notas de la conversación</label>
                <textarea className="form-input" rows={3} maxLength={200} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Ej: hablé con el rector, interesado en demo la próxima semana" style={{ resize: 'vertical' }} />
              </div>

              {createError && <p className="form-error">{createError}</p>}

              <button type="submit" className="btn-primary" disabled={creating} style={{ width: '100%', marginTop: 8 }}>
                {creating ? 'Guardando...' : 'Registrar lead'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
