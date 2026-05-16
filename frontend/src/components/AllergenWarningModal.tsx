import React from 'react';

export interface AllergenAlert {
  allergy: { name: string; severity: string };
  product: string;
}

interface Props {
  open: boolean;
  alerts: AllergenAlert[];
  studentName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const SEVERITY_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  severe:   { label: 'SEVERA',   color: '#fff',    bg: '#dc2626' },
  moderate: { label: 'MODERADA', color: '#92400e', bg: '#fef3c7' },
  mild:     { label: 'LEVE',     color: '#1e3a5f', bg: '#dbeafe' },
};

export default function AllergenWarningModal({ open, alerts, studentName, onConfirm, onCancel }: Props) {
  const [checked, setChecked] = React.useState(false);
  const hasSevere = alerts.some(a => a.allergy.severity === 'severe');

  React.useEffect(() => {
    if (open) setChecked(false);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="allergen-modal-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: hasSevere ? '#dc2626' : '#f59e0b', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div>
              <p id="allergen-modal-title" style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16 }}>
                {hasSevere ? 'ALERTA DE ALERGIA GRAVE' : 'Advertencia de Alérgenos'}
              </p>
              <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                Productos en el carrito de <strong>{studentName}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
            Los siguientes productos contienen alérgenos registrados para este estudiante.
            Por favor revisa antes de confirmar el pedido:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {alerts.map((a, i) => {
              const sev = SEVERITY_LABEL[a.allergy.severity] ?? SEVERITY_LABEL.mild;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 8,
                  background: a.allergy.severity === 'severe' ? 'rgba(220,38,38,0.06)' : 'var(--color-gray-50,#f9fafb)',
                  border: `1.5px solid ${a.allergy.severity === 'severe' ? 'rgba(220,38,38,0.25)' : '#e5e7eb'}`,
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{a.product}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                      Contiene: <strong>{a.allergy.name}</strong>
                    </p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
                    padding: '3px 8px', borderRadius: 6,
                    color: sev.color, background: sev.bg,
                    whiteSpace: 'nowrap',
                  }}>
                    {sev.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Confirmación explícita */}
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '12px 14px', borderRadius: 8,
            background: hasSevere ? 'rgba(220,38,38,0.05)' : '#fffbeb',
            border: `1.5px solid ${hasSevere ? 'rgba(220,38,38,0.3)' : '#fcd34d'}`,
            cursor: 'pointer', marginBottom: 20,
          }}>
            <input
              type="checkbox"
              id="allergen-confirm-checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              style={{ marginTop: 2, accentColor: hasSevere ? '#dc2626' : '#f59e0b', width: 16, height: 16, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
              Entiendo los riesgos. Confirmo que he revisado los alérgenos y asumo la responsabilidad
              de continuar con este pedido para <strong>{studentName}</strong>.
            </span>
          </label>

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', background: '#fff',
                fontSize: 14, fontWeight: 500, color: '#374151',
                cursor: 'pointer',
              }}
            >
              Revisar carrito
            </button>
            <button
              id="allergen-confirm-btn"
              type="button"
              onClick={onConfirm}
              disabled={!checked}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 8,
                border: 'none',
                background: checked ? (hasSevere ? '#dc2626' : '#f59e0b') : '#d1d5db',
                fontSize: 14, fontWeight: 600,
                color: checked ? '#fff' : '#9ca3af',
                cursor: checked ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              Confirmar pedido
            </button>
          </div>

          <p style={{ margin: '12px 0 0', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
            Esta advertencia queda registrada en el sistema — Ley 2120 / Res. 2492/2022
          </p>
        </div>
      </div>
    </div>
  );
}
