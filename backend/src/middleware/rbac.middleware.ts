import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';
import { sendError } from '../utils/apiResponse.js';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'No autenticado', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'No tienes permiso para acceder a este recurso', 403);
      return;
    }
    next();
  };
}
