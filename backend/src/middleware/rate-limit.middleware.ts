import rateLimit from 'express-rate-limit';

// ── A-03: Rate limiting global ────────────────────────────────────────────────
// Protección de base para toda la API — incluye GPS, reportes, órdenes,
// y cualquier ruta nueva que se agregue sin un limiter específico.
// Los limiters específicos (login, register, etc.) son más estrictos y
// se aplican encima de este techo global.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // ventana de 15 minutos
  max: 500,                     // 500 peticiones por IP en esa ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiadas peticiones desde esta IP. Intenta en 15 minutos.' },
  skip: (req) => req.path === '/health', // el healthcheck no cuenta
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Demasiados intentos. Vuelve a intentarlo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Demasiados registros desde esta IP. Intenta en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const deliveryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Demasiados intentos de entrega. Vuelve a intentarlo en 5 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const accountRecoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Demasiadas solicitudes. Vuelve a intentarlo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const leadsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, error: 'Demasiadas solicitudes de demostración desde esta IP. Por favor, intenta de nuevo en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

