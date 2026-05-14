import { useState } from 'react';

export type SealCode =
  | 'ALTO_EN_SODIO'
  | 'ALTO_EN_AZUCARES'
  | 'ALTO_EN_GRASAS_SATURADAS'
  | 'ALTO_EN_GRASAS_TRANS'
  | 'CONTIENE_EDULCORANTES';

export interface SealInfo {
  code: SealCode;
  label: string;
}

const SEAL_META: Record<SealCode, { label: string; tooltip: string }> = {
  ALTO_EN_SODIO: {
    label: 'ALTO EN\nSODIO',
    tooltip: 'El exceso de sodio aumenta el riesgo de hipertensión. La Ley 2120 recomienda limitar su consumo en niños.',
  },
  ALTO_EN_AZUCARES: {
    label: 'ALTO EN\nAZÚCARES',
    tooltip: 'El exceso de azúcares añadidos contribuye a caries, obesidad y diabetes. Limite su consumo en menores.',
  },
  ALTO_EN_GRASAS_SATURADAS: {
    label: 'ALTO EN\nGRASAS SAT.',
    tooltip: 'Las grasas saturadas en exceso aumentan el colesterol LDL y el riesgo cardiovascular.',
  },
  ALTO_EN_GRASAS_TRANS: {
    label: 'ALTO EN\nGRASAS TRANS',
    tooltip: 'Las grasas trans son especialmente dañinas. Aumentan el colesterol malo y reducen el bueno. Evite su consumo en niños.',
  },
  CONTIENE_EDULCORANTES: {
    label: 'CONTIENE\nEDULCORANTES',
    tooltip: 'Contiene edulcorantes artificiales o naturales no calóricos. La Ley 2120 recomienda evitarlos en menores de edad.',
  },
};

interface SealBadgeProps {
  code: SealCode;
  size?: 'sm' | 'md' | 'lg';
}

export function SealBadge({ code, size = 'md' }: SealBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const meta = SEAL_META[code];

  const px = size === 'sm' ? 28 : size === 'lg' ? 56 : 40;
  const fontSize = size === 'sm' ? 6 : size === 'lg' ? 11 : 8;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Octagon SVG + label */}
      <button
        onClick={() => setShowTooltip(v => !v)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={meta.tooltip}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={`Sello Ley 2120: ${meta.label.replace('\n', ' ')}`}
      >
        <svg width={px} height={px} viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))' }}>
          {/* Octagon path */}
          <polygon
            points="30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30"
            fill="#1a1a1a"
            stroke="#fff"
            strokeWidth="3"
          />
          {/* Label — split on \n */}
          {meta.label.split('\n').map((line, i, arr) => (
            <text
              key={i}
              x="50"
              y={arr.length === 1 ? 56 : 44 + i * 18}
              textAnchor="middle"
              fill="#fff"
              fontSize={fontSize * 1.5}
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
              style={{ userSelect: 'none' }}
            >
              {line}
            </text>
          ))}
        </svg>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: '110%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1a1a',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 12,
          lineHeight: 1.5,
          width: 220,
          zIndex: 999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
        }}>
          <strong style={{ display: 'block', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#facc15' }}>
            ⚠ Ley 2120
          </strong>
          {meta.tooltip}
          {/* Arrow */}
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #1a1a1a',
          }} />
        </div>
      )}
    </div>
  );
}

/** Renders multiple seal badges from a product's seal flags */
interface SealBadgeGroupProps {
  sealSodium?: boolean;
  sealSugars?: boolean;
  sealSaturatedFat?: boolean;
  sealTransFat?: boolean;
  sealSweeteners?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SealBadgeGroup({
  sealSodium, sealSugars, sealSaturatedFat, sealTransFat, sealSweeteners, size = 'sm',
}: SealBadgeGroupProps) {
  const seals: SealCode[] = [];
  if (sealSodium)        seals.push('ALTO_EN_SODIO');
  if (sealSugars)        seals.push('ALTO_EN_AZUCARES');
  if (sealSaturatedFat)  seals.push('ALTO_EN_GRASAS_SATURADAS');
  if (sealTransFat)      seals.push('ALTO_EN_GRASAS_TRANS');
  if (sealSweeteners)    seals.push('CONTIENE_EDULCORANTES');

  if (seals.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {seals.map(code => <SealBadge key={code} code={code} size={size} />)}
    </div>
  );
}

/** Pill badge showing nutritional level */
export function NutritionalLevelBadge({ level }: { level: 'LEVEL_1' | 'LEVEL_2' }) {
  const isOk = level === 'LEVEL_1';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
      background: isOk ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)',
      color: isOk ? '#15803d' : '#dc2626',
      border: `1px solid ${isOk ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
    }}>
      {isOk ? '✅ Nivel 1' : '⚠️ Nivel 2'}
    </span>
  );
}
