import rateLimit from 'express-rate-limit';

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
