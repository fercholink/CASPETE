import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface CookiePreferences {
  necessary: true;     // siempre activas
  analytics: boolean;  // opcionales
  marketing: boolean;  // opcionales (desactivadas por defecto para menores)
}

const STORAGE_KEY = 'caspete_cookie_consent';
const CONSENT_VERSION = 'v1.0';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
    else {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version !== CONSENT_VERSION) setVisible(true); // re-pedir si cambió la política
      } catch { setVisible(true); }
    }
  }, []);

  function saveConsent(accepted: CookiePreferences) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...accepted,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    }));
    setVisible(false);
  }

  function acceptAll() {
    saveConsent({ necessary: true, analytics: true, marketing: false }); // marketing=false para menores
  }

  function acceptNecessary() {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  }

  function saveCustom() {
    saveConsent(prefs);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: 'var(--color-surface, #fff)',
        borderTop: '2px solid var(--color-border, #e5e7eb)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
        padding: '20px 24px',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>🍪</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15 }}>
              Usamos cookies — Ley 1581/2012
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted, #6b7280)', lineHeight: 1.5 }}>
              Caspete usa cookies necesarias para operar la plataforma. Puedes aceptar cookies analíticas
              para ayudarnos a mejorar el servicio.{' '}
              <strong>No usamos cookies publicitarias en perfiles de menores.</strong>{' '}
              <Link to="/cookies" style={{ color: 'var(--color-brand, #1a4731)', fontWeight: 600 }}>
                Política de cookies
              </Link>
            </p>
          </div>
        </div>

        {/* Opciones expandibles */}
        {expanded && (
          <div style={{
            background: 'var(--color-gray-50, #f9fafb)', borderRadius: 10,
            padding: '14px 16px', marginBottom: 14,
            border: '1px solid var(--color-border, #e5e7eb)',
          }}>
            {/* Necesarias */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 13 }}>🔒 Necesarias</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted, #6b7280)' }}>
                  Autenticación, seguridad, carrito. Siempre activas.
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-brand, #1a4731)' }}>Siempre activa</span>
            </div>

            {/* Analíticas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 13 }}>📊 Analíticas</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted, #6b7280)' }}>
                  Métricas de uso anónimas para mejorar la plataforma.
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={prefs.analytics}
                  onChange={e => setPrefs(p => ({ ...p, analytics: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{prefs.analytics ? 'Sí' : 'No'}</span>
              </label>
            </div>

            {/* Publicitarias */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 13 }}>📣 Publicitarias</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted, #6b7280)' }}>
                  Desactivadas en cuentas vinculadas a menores de edad.
                </p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>Deshabilitado</span>
            </div>
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={acceptAll}
            className="btn-primary"
            style={{ padding: '9px 20px', fontSize: 13 }}
          >
            Aceptar todo
          </button>
          <button
            onClick={acceptNecessary}
            className="btn-ghost"
            style={{ padding: '9px 20px', fontSize: 13 }}
          >
            Solo necesarias
          </button>
          {expanded ? (
            <button
              onClick={saveCustom}
              className="btn-ghost"
              style={{ padding: '9px 20px', fontSize: 13 }}
            >
              Guardar preferencias
            </button>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-brand, #1a4731)', fontWeight: 600, padding: '9px 4px', textDecoration: 'underline' }}
            >
              Personalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
