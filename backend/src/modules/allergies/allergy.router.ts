import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import {
  listAllergies, createAllergy,
  getStudentAllergies, setStudentAllergies,
  getProductAllergens, setProductAllergens,
  checkAllergenAlert,
} from './allergy.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

const superOnly = requireRole('SUPER_ADMIN');
const allRoles  = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');

// GET  /api/allergies          — catálogo maestro de alergias
router.get('/', allRoles, async (_req: Request, res: Response) => {
  const data = await listAllergies();
  sendSuccess(res, data);
});

// POST /api/allergies          — crear nueva alergia (SUPER_ADMIN)
router.post('/', superOnly, async (req: Request, res: Response) => {
  const data = await createAllergy(req.body as { name: string; severity?: string; description?: string }, req.user!);
  res.status(201).json({ data });
});

// GET  /api/allergies/students/:id         — alergias de un estudiante
router.get('/students/:id', allRoles, async (req: Request, res: Response) => {
  const data = await getStudentAllergies(req.params['id'] as string);
  sendSuccess(res, data);
});

// PUT  /api/allergies/students/:id         — reemplazar alergias del estudiante
router.put('/students/:id', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PARENT'), async (req: Request, res: Response) => {
  const { allergyIds } = req.body as { allergyIds: string[] };
  const data = await setStudentAllergies(req.params['id'] as string, allergyIds ?? [], req.user!);
  sendSuccess(res, data);
});

// GET  /api/allergies/products/:id         — alérgenos de un producto
router.get('/products/:id', allRoles, async (req: Request, res: Response) => {
  const data = await getProductAllergens(req.params['id'] as string);
  sendSuccess(res, data);
});

// PUT  /api/allergies/products/:id         — reemplazar alérgenos de un producto
router.put('/products/:id', superOnly, async (req: Request, res: Response) => {
  const { allergyIds } = req.body as { allergyIds: string[] };
  const data = await setProductAllergens(req.params['id'] as string, allergyIds ?? [], req.user!);
  sendSuccess(res, data);
});

// POST /api/allergies/check    — verificar alertas en carrito
router.post('/check', allRoles, async (req: Request, res: Response) => {
  const { studentId, storeProductIds } = req.body as { studentId: string; storeProductIds: string[] };
  if (!studentId || !Array.isArray(storeProductIds)) {
    res.status(400).json({ error: 'studentId y storeProductIds son requeridos' });
    return;
  }
  const data = await checkAllergenAlert(studentId, storeProductIds);
  sendSuccess(res, data);
});

export default router;
