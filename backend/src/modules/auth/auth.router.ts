import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { loginLimiter, registerLimiter } from '../../middleware/rate-limit.middleware.js';
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
router.post('/forgot-password', authController.forgotPassword);

// POST  /api/auth/reset-password — establecer nueva contraseña con token
router.post('/reset-password', authController.resetPassword);

// ── Google OAuth ─────────────────────────────────────────────────────────────
// GET  /api/auth/google         — redirige a Google para autenticación
router.get(
  '/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/user.phonenumbers.read'], 
    session: false 
  }),
);

// GET  /api/auth/google/callback — callback de Google
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_failed' }),
  (req, res) => {
    const result = req.user as { token: string; refresh_token: string } | undefined;
    if (!result) {
      return res.redirect(`${env.FRONTEND_URL.split(',')[0]}/login?error=google_failed`);
    }
    const frontendUrl = (env.FRONTEND_URL.split(',')[0] ?? 'http://localhost:5173').trim();
    return res.redirect(
      `${frontendUrl}/auth/callback?token=${encodeURIComponent(result.token)}&refresh_token=${encodeURIComponent(result.refresh_token)}`,
    );
  },
);

export default router;
