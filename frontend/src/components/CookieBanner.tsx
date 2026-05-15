import { useState, useEffect } from 'react';

interface CookiePreferences {
  necessary: true;     // siempre activas
  analytics: boolean;  // opcionales
  marketing: boolean;  // opcionales (desactivadas por defecto para menores)
}

const STORAGE_KEY = 'caspete_cookie_consent';
const SESSION_KEY = 'caspete_consent_shown';  // Guard de sesión: evita flash al navegar
const CONSENT_VERSION = 'v1.0';
const API_URL = import.meta.env.VITE_API_URL ?? '';

// Fire-and-forget: registra en backend para trazabilidad Ley 1581 (nunca bloquea la UI)
function reportConsentToBackend(accepted: CookiePreferences) {
  try {
    const token = localStorage.getItem('caspete_token');
    const rawUser = localStorage.getItem('caspete_user');
    const userId: string | undefined = rawUser
      ? (JSON.parse(rawUser) as { id?: string }).id
      : undefined;

    const body = JSON.stringify({
      necessary: accepted.necessary,
      analytics: accepted.analytics,
      marketing: accepted.marketing,
      version: CONSENT_VERSION,
      ...(userId ? { userId } : {}),
    });

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_URL}/api/arco/cookie-consent`, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(5000), // máximo 5s, no bloquea la UI
    }).catch(() => {/* silencioso: el consentimiento ya está en localStorage */});
  } catch {/* silencioso */}
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Guard 1: sessionStorage evita el flash al navegar entre páginas
    // (el componente se monta 1 sola vez gracias a RootLayout, pero por si acaso)
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Guard 2: verificar localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as { version?: string };
      if (parsed.version !== CONSENT_VERSION) {
        // Política actualizada: pedir de nuevo
        localStorage.removeItem(STORAGE_KEY);
        setVisible(true);
      } else {
        // Ya aceptado: marcar sesión para no volver a mostrar
        sessionStorage.setItem(SESSION_KEY, '1');
      }
    } catch {
      // JSON corrupto: limpiar y pedir de nuevo
      localStorage.removeItem(STORAGE_KEY);
      setVisible(true);
    }
  }, []);

  function saveConsent(accepted: CookiePreferences) {
    // 1. Guardar en localStorage PRIMERO (nunca depende del backend)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...accepted,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    }));

    // 2. Marcar sesión actual para evitar re-aparición
    sessionStorage.setItem(SESSION_KEY, '1');

    // 3. Ocultar banner inmediatamente
    setVisible(false);

    // 4. Reportar al backend de forma asíncrona (fire-and-forget)
    reportConsentToBackend(accepted);
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
      aria-modal="false"
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
              <a href="/cookies" style={{ color: 'var(--color-brand, #1a4731)', fontWeight: 600 }}>
                Política de cookies
              </a>
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
