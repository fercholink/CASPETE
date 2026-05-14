interface SealFreeFilterProps {
  value: boolean;
  onChange: (v: boolean) => void;
  count?: number; // optional count of seal-free products
}

/**
 * Toggle "Libre de Sellos – Ley 2120" (Sección 3.2 del documento técnico).
 * Al activarse filtra productos con nutritional_level = LEVEL_1.
 */
export function SealFreeFilter({ value, onChange, count }: SealFreeFilterProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 99,
        border: value ? '2px solid #15803d' : '2px solid var(--color-border)',
        background: value ? 'rgba(22,163,74,0.08)' : 'var(--color-surface)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: 13,
        fontWeight: 600,
        color: value ? '#15803d' : 'var(--color-text-muted)',
        whiteSpace: 'nowrap',
      }}
      title="Muestra solo productos sin sellos de advertencia (Nivel 1 – Ley 2120)"
      aria-pressed={value}
    >
      {/* Octagon miniature */}
      <svg width={18} height={18} viewBox="0 0 100 100">
        <polygon
          points="30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30"
          fill={value ? '#15803d' : '#94a3b8'}
          stroke={value ? '#15803d' : '#94a3b8'}
          strokeWidth="2"
        />
        {value && (
          <text x="50" y="60" textAnchor="middle" fill="#fff" fontSize="52" fontWeight="bold" fontFamily="Arial">✓</text>
        )}
      </svg>
      Libre de Sellos
      {count != null && (
        <span style={{
          marginLeft: 2,
          background: value ? '#15803d' : 'var(--color-gray-100)',
          color: value ? '#fff' : 'var(--color-text-muted)',
          borderRadius: 99,
          padding: '1px 7px',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          transition: 'all 0.2s',
        }}>{count}</span>
      )}
    </button>
  );
}

interface SweetenerAlertProps {
  productNames?: string[]; // products with sweeteners
  onReplace?: () => void;
}

/**
 * Banner de alerta de edulcorantes (Sección 3.3 – PRIORIDAD ALTA).
 * Se muestra cuando una lonchera incluye bebidas/postres con edulcorantes.
 */
export function SweetenerAlert({ productNames = [], onReplace }: SweetenerAlertProps) {
  if (productNames.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '14px 16px',
      borderRadius: 12,
      background: 'rgba(234,179,8,0.08)',
      border: '1.5px solid rgba(234,179,8,0.4)',
      marginBottom: 16,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13, color: '#854d0e' }}>
          Alerta de Edulcorantes – Ley 2120
        </p>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: '#713f12', lineHeight: 1.5 }}>
          Esta lonchera contiene productos con edulcorantes.{' '}
          <strong>La Ley 2120 recomienda evitar su consumo en menores.</strong>
        </p>
        {productNames.length > 0 && (
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#92400e' }}>
            Productos afectados: {productNames.join(', ')}
          </p>
        )}
        {onReplace && (
          <button
            onClick={onReplace}
            style={{
              background: 'none',
              border: '1px solid #ca8a04',
              color: '#92400e',
              borderRadius: 8,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 Sustituir por alternativa sin edulcorantes
          </button>
        )}
      </div>
    </div>
  );
}

interface ComplianceScoreBadgeProps {
  score: number; // 0–100
  isSeaFree: boolean;
}

/** Muestra el compliance score de una lonchera (Sección 2.4) */
export function ComplianceScoreBadge({ score, isSeaFree }: ComplianceScoreBadgeProps) {
  const color = score === 100 ? '#15803d' : score >= 70 ? '#ca8a04' : '#dc2626';
  const bg    = score === 100 ? 'rgba(22,163,74,0.08)' : score >= 70 ? 'rgba(202,138,4,0.08)' : 'rgba(220,38,38,0.08)';

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', borderRadius: 99,
      background: bg, border: `1.5px solid ${color}20`,
    }}>
      {/* Mini ring score */}
      <svg width={24} height={24} viewBox="0 0 36 36">
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${score}, 100`} strokeLinecap="round" />
        <text x="18" y="21" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">{score}</text>
      </svg>
      <div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color }}>
          {score === 100 ? '✅ Lonchera Ley 2120' : `${score}% cumplimiento`}
        </p>
        {isSeaFree && (
          <p style={{ margin: 0, fontSize: 11, color: '#15803d' }}>100% libre de sellos</p>
        )}
      </div>
    </div>
  );
}
