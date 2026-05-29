import { Router } from 'express';
import * as courseController from './course.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

const allAcademicRoles = requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT');
const adminRoles = requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN');

// GET    /api/courses — List all courses
router.get('/', allAcademicRoles, courseController.list);

// GET    /api/courses/:id — Get details of a single course
router.get('/:id', allAcademicRoles, courseController.getOne);

// POST   /api/courses — Create a course
router.post('/', adminRoles, courseController.create);

// PATCH/PUT  /api/courses/:id — Update a course / Sync enrollment
router.patch('/:id', adminRoles, courseController.update);
router.put('/:id', adminRoles, courseController.update);

// DELETE /api/courses/:id — Delete a course
router.delete('/:id', adminRoles, courseController.deleteOne);

// POST   /api/courses/:id/students — Sychronize course student enrollment
router.post('/:id/students', adminRoles, courseController.syncStudents);

export default router;
