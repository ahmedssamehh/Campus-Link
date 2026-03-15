// src/services/redisPublisher.js
const Redis = require('ioredis');
const logger = require('../utils/logger');

const CHANNEL = 'chat_messages';

let publisher = null;
let reconnecting = false;

/**
 * Initialize Redis publisher with resilient auto-reconnect.
 * Falls back gracefully when Redis is unavailable (single-server mode).
 */
function getPublisher() {
    if (publisher) return publisher;

    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    const MAX_RETRIES = 3;

    publisher = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > MAX_RETRIES) {
                return null;
            }
            const delay = Math.min(times * 500, 5000);
            logger.info(`Redis publisher retry #${times}/${MAX_RETRIES} in ${delay}ms`);
            return delay;
        },
        lazyConnect: true,
        enableReadyCheck: true,
        reconnectOnError(err) {
            const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
            return targetErrors.some(e => err.message.includes(e));
        }
    });

    let errorLogged = false;

    publisher.on('error', (err) => {
        if (!errorLogged) {
            logger.warn('Redis publisher error:', err.message);
            errorLogged = true;
        }
    });

    publisher.on('connect', () => {
        logger.info('Redis publisher connected');
        reconnecting = false;
        errorLogged = false;
    });

    publisher.on('close', () => {});

    publisher.on('reconnecting', () => {
        if (!reconnecting) {
            logger.info('Redis publisher reconnecting...');
            reconnecting = true;
        }
    });

    publisher.on('ready', () => {
        logger.info('Redis publisher ready');
    });

    return publisher;
}

/**
 * Publish a message payload to the chat channel.
 * @param {Object} payload - { sender, group, receiver, content, type }
 * @returns {Promise<boolean>} true if published, false if Redis unavailable
 */
async function publishMessage(payload) {
    try {
        const pub = getPublisher();
        if (pub.status !== 'ready') {
            await pub.connect().catch(() => {});
        }
        if (pub.status === 'ready') {
            await pub.publish(CHANNEL, JSON.stringify(payload));
            return true;
        }
        return false;
    } catch (err) {
        logger.warn('Redis publish failed:', err.message);
        return false;
    }
}

/**
 * Check if Redis publisher is connected and ready.
 * @returns {boolean}
 */
function isPublisherReady() {
    return publisher && publisher.status === 'ready';
}

module.exports = { getPublisher, publishMessage, isPublisherReady, CHANNEL };
