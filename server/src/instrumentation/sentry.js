/**
 * Optional Sentry error tracking. Set SENTRY_DSN in Railway to enable.
 * @see https://docs.sentry.io/platforms/javascript/guides/node/
 */
let initialized = false;
let Sentry = null;

function initSentry() {
    if (initialized || !process.env.SENTRY_DSN) {
        return null;
    }
    try {
        // eslint-disable-next-line global-require
        Sentry = require('@sentry/node');
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            release: process.env.SENTRY_RELEASE || 'campus-link-server@1.0.0',
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.08 : 0,
        });
        initialized = true;
        return Sentry;
    } catch (e) {
        return null;
    }
}

function captureException(err, context) {
    if (!Sentry || !err) return;
    Sentry.captureException(err, context ? { extra: context } : undefined);
}

function captureMessage(message, level = 'info') {
    if (!Sentry || !message) return;
    Sentry.captureMessage(message, level);
}

module.exports = {
    initSentry,
    captureException,
    captureMessage,
    getClient: () => Sentry,
};
