import * as Sentry from '@sentry/node';

/**
 * Captura errores que hoy se tragan en silencio (fuera del ciclo request/response
 * de Express, donde Sentry.setupExpressErrorHandler no aplica): servidor TCP de
 * GPS, cron jobs, notificaciones push, etc. Sin SENTRY_DSN configurado, Sentry.
 * captureException no hace nada — esta función sigue siendo segura de llamar.
 */
export function captureError(err: unknown, module: string, extra?: Record<string, unknown>): void {
  console.error(`[${module}]`, extra ?? '', err);
  Sentry.captureException(err, { tags: { module }, ...(extra && { extra }) });
}
