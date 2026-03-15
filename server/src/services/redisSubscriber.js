// src/services/redisSubscriber.js
const Redis = require('ioredis');
const { CHANNEL } = require('./redisPublisher');
const logger = require('../utils/logger');

let subscriber = null;
let messageHandler = null;
let reconnecting = false;

/**
 * Initialize Redis subscriber and set up message listener.
 * Auto-reconnects with exponential backoff.
 * @param {Function} handler - callback(payload) invoked for each message
 */
function initSubscriber(handler) {
    if (subscriber) return subscriber;

    messageHandler = handler;
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    const MAX_RETRIES = 3;

    subscriber = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > MAX_RETRIES) {
                logger.info('Redis unavailable — running in single-server mode');
                return null;
            }
            const delay = Math.min(times * 500, 5000);
            logger.info(`Redis subscriber retry #${times}/${MAX_RETRIES} in ${delay}ms`);
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

    subscriber.on('error', (err) => {
        if (!errorLogged) {
            logger.warn('Redis subscriber error:', err.message);
            errorLogged = true;
        }
    });

    subscriber.on('connect', () => {
        logger.info('Redis subscriber connected');
        reconnecting = false;
        errorLogged = false;
    });

    subscriber.on('close', () => {});

    subscriber.on('reconnecting', () => {
        if (!reconnecting) {
            logger.info('Redis subscriber reconnecting...');
            reconnecting = true;
        }
    });

    // Re-subscribe on ready (handles reconnect case)
    subscriber.on('ready', () => {
        logger.info('Redis subscriber ready, subscribing to channel...');
        subscriber.subscribe(CHANNEL).then(() => {
            logger.info(`Redis subscribed to channel: ${CHANNEL}`);
        }).catch((err) => {
            logger.error('Failed to subscribe after ready:', err.message);
        });
    });

    subscriber.on('message', (channel, message) => {
        if (channel === CHANNEL && messageHandler) {
            try {
                const payload = JSON.parse(message);
                messageHandler(payload);
            } catch (err) {
                logger.error('Failed to parse Redis message:', err.message);
            }
        }
    });

    // Connect
    subscriber.connect()
        .then(() => subscriber.subscribe(CHANNEL))
        .then(() => logger.info(`Redis subscribed to channel: ${CHANNEL}`))
        .catch((err) => {
            logger.warn('Redis subscriber connection failed:', err.message);
            logger.info('Running in single-server mode (no Redis)');
        });

    return subscriber;
}

/**
 * Check if Redis subscriber is connected and ready.
 * @returns {boolean}
 */
function isSubscriberReady() {
    return subscriber && subscriber.status === 'ready';
}

function getSubscriber() {
    return subscriber;
}

module.exports = { initSubscriber, getSubscriber, isSubscriberReady };
