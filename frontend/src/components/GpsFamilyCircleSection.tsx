import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

interface PlanSummary {
  has_tracker: boolean;
  tracker_id: string | null;
  base_monthly_price: number;
  extra_guardian_price: number;
  included_guardians: number;
  max_emergency_numbers: number;
  active_guardians_count: number;
  extra_guardians_count: number;
  total_monthly_price: number;
  subscription_paid_until: string | null;
}

interface Guardian {
  id: string;
  relationship: string;
  can_view_live: boolean;
  can_view_history: boolean;
  can_receive_alerts: boolean;
  can_view_meals: boolean;
  is_included_slot: boolean;
  extra_price: number | string;
  active: boolean;
  created_at: string;
  guardian: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  MOTHER: 'Mamá',
  FATHER: 'Papá',
  GRANDPARENT: 'Abuelo(a)',
  UNCLE_AUNT: 'Tío(a)',
  LEGAL_TUTOR: 'Tutor legal',
  FAMILY_OTHER: 'Familiar / Cuidador',
};

export default function GpsFamilyCircleSection({ studentId }: { studentId: string }) {
  const [summary, setSummary] = useState<PlanSummary | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulario para enrolar
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('MOTHER');
  const [canViewLive, setCanViewLive] = useState(true);
  const [canViewHistory, setCanViewHistory] = useState(true);
  const [canReceiveAlerts, setCanReceiveAlerts] = useState(true);
  const [canViewMeals, setCanViewMeals] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [sumRes, guarRes] = await Promise.all([
        apiClient.get<{ data: PlanSummary }>(`/gps/students/${studentId}/plan-summary`),
        apiClient.get<{ data: Guardian[] }>(`/gps/students/${studentId}/guardians`),
      ]);
      setSummary(sumRes.data.data);
      setGuardians(guarRes.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo cargar la información del círculo familiar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      await apiClient.post(`/gps/students/${studentId}/guardians`, {
        email: email.trim().toLowerCase(),
        relationship,
        can_view_live: canViewLive,
        can_view_history: canViewHistory,
        can_receive_alerts: canReceiveAlerts,
        can_view_meals: canViewMeals,
      });

      setFormSuccess('Familiar agregado exitosamente ✓');
      setEmail('');
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Error al enrolar familiar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (guardianRecordId: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name} del círculo familiar? Perderá acceso a la ubicación.`)) return;
    try {
      await apiClient.delete(`/gps/students/${studentId}/guardians/${guardianRecordId}`);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al eliminar familiar');
    }
  };

  if (loading) {
    return <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando círculo familiar...</p>;
  }

  const isNextSlotIncluded = summary ? summary.active_guardians_count < summary.included_guardians : false;

  return (
    <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
            👨‍👩‍👦 Círculo Familiar (Ubicación Compartida)
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
            Comparte el monitoreo GPS en tiempo real con mamá, abuelos o cuidadores autorizados.
          </p>
        </div>
        {!showForm && (
          <button
            className="btn-ghost"
            style={{ fontSize: 12, padding: '4px 10px', fontWeight: 600 }}
            onClick={() => { setShowForm(true); setFormError(''); setFormSuccess(''); }}
          >
            + Agregar Familiar
          </button>
        )}
      </div>

      {error && <p className="form-error" style={{ margin: '0 0 12px' }}>{error}</p>}

      {/* Resumen del plan configurable */}
      {summary && (
        <div style={{ background: '#fff', padding: 12, borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span>
              Plan Base: <strong>${summary.base_monthly_price.toLocaleString('es-CO')}/mes</strong> (Minutos ilimitados a {summary.max_emergency_numbers} números + {summary.included_guardians} familiar incluido)
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-brand-deep)' }}>
              Total: ${summary.total_monthly_price.toLocaleString('es-CO')}/mes
            </span>
          </div>
          {summary.extra_guardians_count > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#c2410c' }}>
              Incluye {summary.extra_guardians_count} familiar(es) adicional(es) a +${summary.extra_guardian_price.toLocaleString('es-CO')}/mes c/u.
            </p>
          )}
        </div>
      )}

      {/* Formulario para enrolar */}
      {showForm && (
        <form onSubmit={handleEnroll} style={{ background: '#fff', padding: 14, borderRadius: 10, border: '1px solid var(--color-brand-deep)', marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Enrolar un nuevo familiar</h4>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-placeholder)' }}>
            El familiar debe tener previamente una cuenta activa en Kidway como acudiente.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            <input
              className="form-input"
              type="email"
              required
              placeholder="Correo electrónico registrado en Kidway"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 600, width: 100 }}>Parentesco:</label>
              <select
                className="form-input"
                style={{ flex: 1 }}
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              >
                <option value="MOTHER">Mamá</option>
                <option value="FATHER">Papá</option>
                <option value="GRANDPARENT">Abuelo(a)</option>
                <option value="UNCLE_AUNT">Tío(a)</option>
                <option value="LEGAL_TUTOR">Tutor legal</option>
                <option value="FAMILY_OTHER">Otro familiar / Cuidador</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8, background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Permisos del Familiar:</span>
              <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={canViewLive} onChange={(e) => setCanViewLive(e.target.checked)} />
                <span>📍 Ver ubicación en tiempo real</span>
              </label>
              <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={canViewHistory} onChange={(e) => setCanViewHistory(e.target.checked)} />
                <span>🕒 Ver historial de rutas del día</span>
              </label>
              <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={canReceiveAlerts} onChange={(e) => setCanReceiveAlerts(e.target.checked)} />
                <span>🔔 Recibir alertas de llegada y salida del colegio</span>
              </label>
              <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <input type="checkbox" checked={canViewMeals} onChange={(e) => setCanViewMeals(e.target.checked)} />
                <span>🍱 Ver consumo de loncheras (Función futura)</span>
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 12, padding: 8, borderRadius: 6, background: isNextSlotIncluded ? 'rgba(5, 150, 105, 0.08)' : 'rgba(234, 88, 12, 0.08)' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: isNextSlotIncluded ? '#059669' : '#c2410c' }}>
              {isNextSlotIncluded
                ? `✓ Este familiar ocupará tu cupo gratuito incluido ($0 extra en los $${summary?.base_monthly_price.toLocaleString('es-CO')}/mes).`
                : `ℹ️ Este familiar sumará +$${summary?.extra_guardian_price.toLocaleString('es-CO')}/mes adicionales a tu suscripción mensual.`}
            </p>
          </div>

          {formError && <p className="form-error" style={{ margin: '0 0 10px' }}>{formError}</p>}
          {formSuccess && <p style={{ margin: '0 0 10px', fontSize: 12, color: '#059669', fontWeight: 600 }}>{formSuccess}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting || !email.trim()}>
              {submitting ? 'Enrolando...' : 'Confirmar y Enrolar'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de familiares activos */}
      {guardians.length === 0 ? (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--color-placeholder)', textAlign: 'center' }}>
          Aún no has agregado familiares a este estudiante. Agrega a mamá, abuelos o cuidadores para que también puedan ver su ubicación.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {guardians.map((g) => (
            <div
              key={g.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#fff',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 13 }}>{g.guardian.full_name}</strong>
                  <span style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: 'var(--color-text-muted)' }}>
                    {RELATIONSHIP_LABELS[g.relationship] || g.relationship}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: g.is_included_slot ? 'rgba(5,150,105,0.1)' : 'rgba(234,88,12,0.1)',
                      color: g.is_included_slot ? '#059669' : '#c2410c',
                    }}
                  >
                    {g.is_included_slot ? 'Cupo incluido ($0)' : `+$${Number(g.extra_price).toLocaleString('es-CO')}/mes`}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  ✉️ {g.guardian.email} · {g.can_view_live ? '📍 En vivo' : ''} {g.can_view_history ? '· 🕒 Rutas' : ''} {g.can_receive_alerts ? '· 🔔 Alertas' : ''}
                </div>
              </div>

              <button
                className="btn-ghost"
                style={{ fontSize: 11, padding: '4px 8px', color: '#dc2626' }}
                onClick={() => handleDelete(g.id, g.guardian.full_name)}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
