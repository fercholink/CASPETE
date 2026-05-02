import type { Response } from 'express';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message !== undefined && { message }),
  } satisfies ApiSuccess<T>);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  details?: unknown,
) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(details !== undefined && { details }),
  } satisfies ApiError);
}
