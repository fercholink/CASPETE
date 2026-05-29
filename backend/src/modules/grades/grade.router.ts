import { Router } from 'express';
import * as gradeController from './grade.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

const allAcademicRoles = requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT');
const writeRoles = requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER');

// GET    /api/grades — List all grades (filtered by context)
router.get('/', allAcademicRoles, gradeController.list);

// GET    /api/grades/:id — Get details of a single grade
router.get('/:id', allAcademicRoles, gradeController.getOne);

// POST   /api/grades — Register a new grade
router.post('/', writeRoles, gradeController.create);

// PATCH  /api/grades/:id — Update a grade
router.patch('/:id', writeRoles, gradeController.update);

// DELETE /api/grades/:id — Delete a grade
router.delete('/:id', writeRoles, gradeController.deleteOne);

export default router;
