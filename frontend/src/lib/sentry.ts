import * as Sentry from '@sentry/react';

const dsn = import.meta.env['VITE_SENTRY_DSN'];

export function initSentry() {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.PROD ? 'production' : 'development',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  });
}
