import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    sendError(res, 'Datos inválidos', 422, err.flatten().fieldErrors);
    return;
  }
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }
  const errMsg = err instanceof Error ? err.message : String(err);
  sendError(res, 'Error interno del servidor', 500, env.NODE_ENV === 'development' ? errMsg : undefined);
}
