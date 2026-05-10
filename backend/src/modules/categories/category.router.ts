import { Router } from 'express';
import * as categoryController from './category.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

const allRoles = requireRole('PARENT', 'VENDOR', 'SCHOOL_ADMIN', 'SUPER_ADMIN');
const superOnly = requireRole('SUPER_ADMIN');

// GET    /api/categories?all=true&counts=true
router.get('/', allRoles, categoryController.list);

// GET    /api/categories/:id
router.get('/:id', allRoles, categoryController.getOne);

// POST   /api/categories
router.post('/', superOnly, categoryController.create);

// PATCH  /api/categories/:id
router.patch('/:id', superOnly, categoryController.update);

// DELETE /api/categories/:id
router.delete('/:id', superOnly, categoryController.deleteOne);

export default router;
