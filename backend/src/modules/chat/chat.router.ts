import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import * as chat from './chat.service.js';
import { CreateThreadSchema, SendMessageSchema, CloseThreadSchema } from './chat.schemas.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ── GET /api/chat/unread — Contador de no leídos (badge Dashboard) ───────────
router.get('/unread', async (req, res, next) => {
  try {
    const data = await chat.getUnreadCount(req.user!);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// ── POST /api/chat/threads — Crear hilo (solo VENDOR) ───────────────────────
router.post(
  '/threads',
  requireRole(['VENDOR']),
  async (req, res, next) => {
    try {
      const body = CreateThreadSchema.parse(req.body);
      const data = await chat.createThread(body, req.user!);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  },
);

// ── GET /api/chat/threads — Listar hilos del actor ──────────────────────────
router.get('/threads', async (req, res, next) => {
  try {
    const data = await chat.listThreads(req.user!);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// ── GET /api/chat/threads/:id — Hilo + mensajes completos ───────────────────
router.get('/threads/:id', async (req, res, next) => {
  try {
    const data = await chat.getThread(req.params.id, req.user!);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// ── POST /api/chat/threads/:id/messages — Enviar mensaje ────────────────────
router.post('/threads/:id/messages', async (req, res, next) => {
  try {
    const body = SendMessageSchema.parse(req.body);
    const data = await chat.sendMessage(req.params.id, body, req.user!);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

// ── PATCH /api/chat/threads/:id/read — Marcar mensajes leídos ───────────────
router.patch('/threads/:id/read', async (req, res, next) => {
  try {
    const data = await chat.markThreadRead(req.params.id, req.user!);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// ── PATCH /api/chat/threads/:id/close — Cerrar / resolver hilo ──────────────
router.patch(
  '/threads/:id/close',
  requireRole(['VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const body = CloseThreadSchema.parse(req.body);
      const threadId = String(req.params.id);
      const data = await chat.closeThread(threadId, body, req.user!);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  },
);


export default router;
