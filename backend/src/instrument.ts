import * as Sentry from '@sentry/node';
import { env } from './config/env.js';

// Debe importarse antes que cualquier otro módulo (server.ts) para que la
// instrumentación automática de Sentry (http, express, pg) quede activa.
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
  console.log('[Sentry] Monitoreo de errores activo');
}
