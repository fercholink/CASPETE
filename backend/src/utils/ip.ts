import type { Request } from 'express';

/** IP real del cliente detrás del proxy de EasyPanel (X-Forwarded-For, con fallback a la conexión directa). */
export function getClientIp(req: Request | undefined): string | null {
  const forwardedFor = req?.headers['x-forwarded-for'];
  const remoteAddr = req?.socket?.remoteAddress;
  if (typeof forwardedFor === 'string') return (forwardedFor.split(',')[0] ?? forwardedFor).trim().substring(0, 45);
  if (typeof remoteAddr === 'string') return remoteAddr.substring(0, 45);
  return null;
}
