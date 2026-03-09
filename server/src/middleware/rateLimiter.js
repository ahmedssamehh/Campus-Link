// src/middleware/rateLimiter.js

/**
 * In-memory sliding-window rate limiter for socket events.
 * Tracks per-user event timestamps and enforces limits.
 */

// Map<userId, { timestamps: number[], blocked: boolean }>
const userBuckets = new Map();

// Config
const WINDOW_MS = 10000; // 10-second window
const MAX_MESSAGES = 15; // max messages per window
const BURST_LIMIT = 5; // max messages in 1 second
const BURST_WINDOW_MS = 1000; // 1-second burst window
const CLEANUP_INTERVAL = 60000; // cleanup every 60s

/**
 * Check if a user is rate-limited.
 * @param {string} userId
 * @returns {{ allowed: boolean, retryAfter?: number }}
 */
function checkRateLimit(userId) {
    const now = Date.now();

    if (!userBuckets.has(userId)) {
        userBuckets.set(userId, { timestamps: [] });
    }

    const bucket = userBuckets.get(userId);

    // Prune old timestamps outside the window
    bucket.timestamps = bucket.timestamps.filter(t => now - t < WINDOW_MS);

    // Check sliding window limit
    if (bucket.timestamps.length >= MAX_MESSAGES) {
        const oldest = bucket.timestamps[0];
        const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000);
        return { allowed: false, retryAfter };
    }

    // Check burst limit (messages in last 1 second)
    const recentBurst = bucket.timestamps.filter(t => now - t < BURST_WINDOW_MS);
    if (recentBurst.length >= BURST_LIMIT) {
        return { allowed: false, retryAfter: 1 };
    }

    // Allow and record
    bucket.timestamps.push(now);
    return { allowed: true };
}

/**
 * Reset rate limit for a user (e.g., on disconnect).
 * @param {string} userId
 */
function resetRateLimit(userId) {
    userBuckets.delete(userId);
}

// Periodic cleanup of stale entries
setInterval(() => {
    const now = Date.now();
    for (const [userId, bucket] of userBuckets.entries()) {
        bucket.timestamps = bucket.timestamps.filter(t => now - t < WINDOW_MS);
        if (bucket.timestamps.length === 0) {
            userBuckets.delete(userId);
        }
    }
}, CLEANUP_INTERVAL);

module.exports = { checkRateLimit, resetRateLimit };