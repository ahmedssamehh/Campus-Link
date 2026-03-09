// src/services/redisSubscriber.js
const Redis = require('ioredis');
const { CHANNEL } = require('./redisPublisher');

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

    subscriber = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            const delay = Math.min(times * 500, 30000);
            console.log(`⏳ Redis subscriber retry #${times} in ${delay}ms`);
            return delay;
        },
        lazyConnect: true,
        enableReadyCheck: true,
        reconnectOnError(err) {
            const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
            return targetErrors.some(e => err.message.includes(e));
        }
    });

    subscriber.on('error', (err) => {
        console.warn('⚠️  Redis subscriber error:', err.message);
    });

    subscriber.on('connect', () => {
        console.log('✅ Redis subscriber connected');
        reconnecting = false;
    });

    subscriber.on('close', () => {
        console.warn('⚠️  Redis subscriber connection closed');
    });

    subscriber.on('reconnecting', () => {
        if (!reconnecting) {
            console.log('🔄 Redis subscriber reconnecting...');
            reconnecting = true;
        }
    });

    // Re-subscribe on ready (handles reconnect case)
    subscriber.on('ready', () => {
        console.log('✅ Redis subscriber ready, subscribing to channel...');
        subscriber.subscribe(CHANNEL).then(() => {
            console.log(`✅ Redis subscribed to channel: ${CHANNEL}`);
        }).catch((err) => {
            console.error('❌ Failed to subscribe after ready:', err.message);
        });
    });

    subscriber.on('message', (channel, message) => {
        if (channel === CHANNEL && messageHandler) {
            try {
                const payload = JSON.parse(message);
                messageHandler(payload);
            } catch (err) {
                console.error('❌ Failed to parse Redis message:', err.message);
            }
        }
    });

    // Connect
    subscriber.connect()
        .then(() => subscriber.subscribe(CHANNEL))
        .then(() => console.log(`✅ Redis subscribed to channel: ${CHANNEL}`))
        .catch((err) => {
            console.warn('⚠️  Redis subscriber connection failed:', err.message);
            console.log('ℹ️  Running in single-server mode (no Redis)');
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