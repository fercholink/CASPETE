import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { getComplianceDashboard, getOrderComplianceCertificate } from './compliance.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

const adminRoles = requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN');
const allRoles   = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');

// GET /api/reports/compliance-dashboard  → KPIs Ley 2120
router.get('/compliance-dashboard', adminRoles, async (req: Request, res: Response) => {
  const data = await getComplianceDashboard(req.user!);
  sendSuccess(res, data);
});

// GET /api/reports/compliance-certificate/:orderId → Certificado por pedido
router.get('/compliance-certificate/:orderId', allRoles, async (req: Request, res: Response) => {
  const cert = await getOrderComplianceCertificate(req.params['orderId'] as string, req.user!);
  sendSuccess(res, cert);
});

export default router;
