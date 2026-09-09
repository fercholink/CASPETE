import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';
import type { UserRole } from '@prisma/client';
// M-01: Re-exportar requireRole desde rbac.middleware para evitar duplicación.
// Todos los routers deben importar desde auth.middleware O desde rbac.middleware
// indistintamente — ambos apuntan a la misma función.
export { requireRole } from './rbac.middleware.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  schoolId: string | null;
}

// Override Express.User globally so req.user is always JwtPayload
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends JwtPayload {}
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // 1) Intentar desde cabecera Authorization: Bearer <token>  (flujo email/password, apps móviles)
  // 2) Fallback: cookie HttpOnly 'access_token'              (flujo OAuth Google)
  // El header tiene prioridad para mantener compatibilidad con clientes existentes.
  let token: string | undefined;

  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token as string;
  }

  if (!token) {
    sendError(res, 'Token de autenticación requerido', 401);
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    sendError(res, 'Token inválido o expirado', 401);
  }
}

