/**
 * Client-side error tracking. Set REACT_APP_SENTRY_DSN in Vercel to enable.
 */
import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.REACT_APP_SENTRY_RELEASE || 'campus-link-client@0.1.0',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  });
}

export { Sentry };
