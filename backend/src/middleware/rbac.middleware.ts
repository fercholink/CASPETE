import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';
import { sendError } from '../utils/apiResponse.js';

/**
 * M-01: Firma unificada — acepta roles como rest params O como un único array.
 *   requireRole('PARENT', 'SUPER_ADMIN')   ← estilo rest params (mayoría de routers)
 *   requireRole(['PARENT', 'SUPER_ADMIN'])  ← estilo array (algunos routers con auth.middleware)
 * Ambas sintaxis son equivalentes. Todos los routers existentes compilan
 * sin cambios independientemente de cuál era su estilo de importación original.
 */
export function requireRole(...args: [UserRole[]] | UserRole[]) {
  const roles: UserRole[] = Array.isArray(args[0])
    ? (args[0] as UserRole[])
    : (args as UserRole[]);

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
