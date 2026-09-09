import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { loginLimiter, registerLimiter, accountRecoveryLimiter } from '../../middleware/rate-limit.middleware.js';
import passport from '../../lib/passport.js';
import { env } from '../../config/env.js';

const router = Router();

// POST /api/auth/register
router.post('/register', registerLimiter, authController.register);

// POST /api/auth/login
router.post('/login', loginLimiter, authController.login);

// POST /api/auth/refresh  — renovar access token con refresh token
router.post('/refresh', authController.refresh);

// POST /api/auth/logout   — revocar refresh token
router.post('/logout', authController.logout);

// GET   /api/auth/me             — requiere token válido
router.get('/me', authenticate, authController.me);

// PATCH /api/auth/profile        — actualizar nombre / teléfono
router.patch('/profile', authenticate, authController.updateProfile);

// POST  /api/auth/change-password — cambiar contraseña
router.post('/change-password', authenticate, authController.changePassword);

// POST  /api/auth/forgot-password — solicitar recuperación por email
router.post('/forgot-password', accountRecoveryLimiter, authController.forgotPassword);

// POST  /api/auth/reset-password — establecer nueva contraseña con token
router.post('/reset-password', authController.resetPassword);

// POST  /api/auth/verify-email — confirmar correo electrónico
router.post('/verify-email', authController.verifyEmail);

// POST  /api/auth/resend-verification — reenviar enlace de confirmación
router.post('/resend-verification', accountRecoveryLimiter, authController.resendVerification);

// ── Google OAuth ─────────────────────────────────────────────────────────────
// GET  /api/auth/google         — redirige a Google para autenticación
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  }),
);

// GET  /api/auth/google/callback — callback de Google
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_failed' }),
  (req, res) => {
    const result = req.user as { token: string; refresh_token: string } | undefined;
    const frontendUrl = (env.FRONTEND_URL.split(',')[0] ?? 'http://localhost:5173').trim();

    if (!result) {
      return res.redirect(`${frontendUrl}/login?error=google_failed`);
    }

    const isProduction = env.NODE_ENV === 'production';

    // FIX A-01: Tokens en cookies HttpOnly+Secure en lugar de parámetros en URL.
    // Los parámetros en URL quedan expuestos en: logs de Nginx, historial del navegador
    // y cabeceras Referer. Las cookies HttpOnly son invisibles para JavaScript y no
    // aparecen en logs de servidor ni en headers de terceros.
    res.cookie('access_token', result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutos — igual que JWT_EXPIRES_IN
    });
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días — igual que REFRESH_TOKEN_TTL_MS
      path: '/api/auth/refresh', // restricción de path: solo enviada al endpoint de refresco
    });

    // El frontend recibe la redirección limpia (sin tokens) y llama a /api/auth/me
    // usando la cookie access_token para obtener los datos del usuario.
    return res.redirect(`${frontendUrl}/auth/callback`);
  },
);

export default router;
