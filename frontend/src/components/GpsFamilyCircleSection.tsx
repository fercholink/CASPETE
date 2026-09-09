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
  guardian_email: string;
  status: 'PENDING' | 'ACCEPTED';
  relationship: string;
  can_view_live: boolean;
  can_view_history: boolean;
  can_receive_alerts: boolean;
  can_view_meals: boolean;
  is_included_slot: boolean;
  extra_price: number | string;
  active: boolean;
  created_at: string;
  guardian?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  MOTHER: 'Mamá',
  FATHER: 'Papá',
  GRANDPARENT: 'Abuelo(a)',
  UNCLE_AUNT: 'Tío(a)',
  LEGAL_TUTOR: 'Tutor(a) legal',
  FAMILY_OTHER: 'Familiar / Cuidador',
};

const DEFAULT_SUMMARY: PlanSummary = {
  has_tracker: true,
  tracker_id: null,
  base_monthly_price: 30000,
  extra_guardian_price: 5000,
  included_guardians: 1,
  max_emergency_numbers: 3,
  active_guardians_count: 0,
  extra_guardians_count: 0,
  total_monthly_price: 30000,
  subscription_paid_until: null,
};

export default function GpsFamilyCircleSection({ studentId }: { studentId: string }) {
  const [summary, setSummary] = useState<PlanSummary>(DEFAULT_SUMMARY);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulario para enrolar o invitar
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('MOTHER');
  const [canViewLive, setCanViewLive] = useState(true);
  const [canViewHistory, setCanViewHistory] = useState(true);
  const [canReceiveAlerts, setCanReceiveAlerts] = useState(true);
  const [canViewMeals, setCanViewMeals] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [sumRes, guarRes] = await Promise.allSettled([
        apiClient.get<{ data: PlanSummary }>(`/gps/students/${studentId}/plan-summary`),
        apiClient.get<{ data: Guardian[] }>(`/gps/students/${studentId}/guardians`),
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.data?.data) {
        setSummary(sumRes.value.data.data);
      } else {
        setSummary(DEFAULT_SUMMARY);
      }

      if (guarRes.status === 'fulfilled' && Array.isArray(guarRes.value?.data?.data)) {
        setGuardians(guarRes.value.data.data);
      } else {
        setGuardians([]);
      }
    } catch {
      setSummary(DEFAULT_SUMMARY);
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
      const res = await apiClient.post<{ message?: string }>(`/gps/students/${studentId}/guardians`, {
        email: email.trim().toLowerCase(),
        relationship,
        can_view_live: canViewLive,
        can_view_history: canViewHistory,
        can_receive_alerts: canReceiveAlerts,
        can_view_meals: canViewMeals,
      });

      const msg = res.data?.message || 'Invitación procesada exitosamente ✓';
      setFormSuccess(msg);
      setEmail('');
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      setFormError(serverMsg || 'Error al procesar la invitación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (guardianRecordId: string, guardianEmail: string) => {
    setResendingId(guardianRecordId);
    try {
      const res = await apiClient.post<{ message?: string }>(
        `/gps/students/${studentId}/guardians/${guardianRecordId}/resend`,
      );
      alert(res.data?.message || `Invitación reenviada a ${guardianEmail}`);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      alert(serverMsg || 'No se pudo reenviar la invitación');
    } finally {
      setResendingId(null);
    }
  };

  const handleDelete = async (guardianRecordId: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name} del círculo familiar? Perderá acceso a la ubicación.`)) return;
    try {
      await apiClient.delete(`/gps/students/${studentId}/guardians/${guardianRecordId}`);
      await loadData();
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      alert(serverMsg || 'Error al eliminar familiar');
    }
  };

  if (loading) {
    return <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando círculo familiar...</p>;
  }

  const basePrice = summary.base_monthly_price ?? 30000;
  const extraPrice = summary.extra_guardian_price ?? 5000;
  const includedCount = summary.included_guardians ?? 1;
  const isNextSlotIncluded = guardians.filter((g) => g.active).length < includedCount;

  return (
    <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
            👨‍👩‍👦 Círculo Familiar (Ubicación Compartida)
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
            Comparte el monitoreo GPS con mamá, abuelos o cuidadores.
          </p>
        </div>
        {!showForm && (
          <button
            className="btn-ghost"
            style={{ fontSize: 12, padding: '4px 10px', fontWeight: 600 }}
            onClick={() => { setShowForm(true); setFormError(''); setFormSuccess(''); }}
          >
            + Enviar Invitación
          </button>
        )}
      </div>

      {error && <p className="form-error" style={{ margin: '0 0 12px' }}>{error}</p>}
      {formSuccess && (
        <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#166534', fontWeight: 600 }}>{formSuccess}</p>
        </div>
      )}

      {/* Resumen del plan configurable */}
      <div style={{ background: '#fff', padding: 12, borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
          <span>
            Plan Base: <strong>${basePrice.toLocaleString('es-CO')}/mes</strong> (Minutos ilimitados a {summary.max_emergency_numbers ?? 3} números + {includedCount} familiar incluido)
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-brand-deep)' }}>
            Total: ${(summary.total_monthly_price ?? basePrice).toLocaleString('es-CO')}/mes
          </span>
        </div>
        {summary.extra_guardians_count > 0 && (
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#c2410c' }}>
            Incluye {summary.extra_guardians_count} familiar(es) adicional(es) a +${extraPrice.toLocaleString('es-CO')}/mes c/u.
          </p>
        )}
      </div>

      {/* Formulario para enrolar o invitar */}
      {showForm && (
        <form onSubmit={handleEnroll} style={{ background: '#fff', padding: 14, borderRadius: 10, border: '1px solid var(--color-brand-deep)', marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>Invitar o enrolar un familiar</h4>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--color-text-muted)' }}>
            Ingresa el correo de la madre o acudiente. Si aún no tiene cuenta en Kidway, <strong>le enviaremos un correo con un enlace directo</strong> para que se registre y quede vinculada de inmediato.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            <input
              className="form-input"
              type="email"
              required
              placeholder="Correo electrónico (ej: mama@hotmail.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 600, width: 90 }}>Parentesco:</label>
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
                <option value="LEGAL_TUTOR">Tutor(a) legal</option>
                <option value="FAMILY_OTHER">Otro familiar / Cuidador</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8, background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Permisos a otorgar:</span>
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
                ? `✓ Este familiar ocupará tu cupo gratuito incluido ($0 extra dentro de tu plan de $${basePrice.toLocaleString('es-CO')}/mes).`
                : `ℹ️ Este familiar sumará +$${extraPrice.toLocaleString('es-CO')}/mes adicionales a tu suscripción mensual.`}
            </p>
          </div>

          {formError && <p className="form-error" style={{ margin: '0 0 10px' }}>{formError}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting || !email.trim()}>
              {submitting ? 'Enviando invitación...' : '✉️ Enviar Invitación'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de familiares activos e invitaciones pendientes */}
      {guardians.length === 0 ? (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--color-placeholder)', textAlign: 'center' }}>
          Aún no has agregado familiares a este estudiante. Agrega a mamá, abuelos o cuidadores para que también puedan ver su ubicación.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {guardians.map((g) => {
            const isPending = g.status === 'PENDING';
            const displayName = g.guardian?.full_name && g.guardian.full_name !== 'Invitación Pendiente'
              ? g.guardian.full_name
              : g.guardian_email;

            return (
              <div
                key={g.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: isPending ? '#fffbeb' : '#fff',
                  borderRadius: 8,
                  border: `1px solid ${isPending ? '#fde68a' : 'var(--color-border)'}`,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 13 }}>{displayName}</strong>
                    <span style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: 'var(--color-text-muted)' }}>
                      {RELATIONSHIP_LABELS[g.relationship] || g.relationship}
                    </span>
                    {isPending ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#fef3c7', color: '#b45309' }}>
                        ✉️ Invitación enviada (Pendiente)
                      </span>
                    ) : (
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
                        {g.is_included_slot ? 'Cupo incluido ($0)' : `+$${Number(g.extra_price || extraPrice).toLocaleString('es-CO')}/mes`}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
                    ✉️ {g.guardian_email} · {g.can_view_live ? '📍 En vivo' : ''} {g.can_view_history ? '· 🕒 Rutas' : ''} {g.can_receive_alerts ? '· 🔔 Alertas' : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {isPending && (
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 11, padding: '4px 8px', color: 'var(--color-brand-deep)' }}
                      disabled={resendingId === g.id}
                      onClick={() => handleResend(g.id, g.guardian_email)}
                    >
                      {resendingId === g.id ? 'Reenviando...' : 'Reenviar correo'}
                    </button>
                  )}
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 11, padding: '4px 8px', color: '#dc2626' }}
                    onClick={() => handleDelete(g.id, displayName)}
                  >
                    {isPending ? 'Cancelar' : 'Quitar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
