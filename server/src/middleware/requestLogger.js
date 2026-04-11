const logger = require('../utils/logger');

/**
 * Logs each API request with method, path, status, and duration.
 * Skips noisy health checks in production (optional).
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    const path = req.originalUrl || req.url;

    res.on('finish', () => {
        const ms = Date.now() - start;
        const line = `${req.method} ${path} ${res.statusCode} ${ms}ms`;
        if (res.statusCode >= 500) {
            logger.error(line);
        } else if (res.statusCode >= 400) {
            logger.warn(line);
        } else {
            logger.info(line);
        }
    });

    next();
}

module.exports = requestLogger;
