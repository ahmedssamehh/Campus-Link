// src/services/redisSubscriber.js
const Redis = require('ioredis');
const { CHANNEL } = require('./redisPublisher');

let subscriber = null;
let messageHandler = null;

/**
 * Initialize Redis subscriber and set up message listener.
 * @param {Function} handler - callback(payload) invoked for each message
 */
function initSubscriber(handler) {
    if (subscriber) return subscriber;

    messageHandler = handler;
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    subscriber = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 5) {
                console.warn('⚠️  Redis subscriber: max retries reached');
                return null;
            }
            return Math.min(times * 200, 2000);
        },
        lazyConnect: true
    });

    subscriber.on('error', (err) => {
        console.warn('⚠️  Redis subscriber error:', err.message);
    });

    subscriber.on('connect', () => {
        console.log('✅ Redis subscriber connected');
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

    // Connect and subscribe
    subscriber.connect()
        .then(() => subscriber.subscribe(CHANNEL))
        .then(() => console.log(`✅ Redis subscribed to channel: ${CHANNEL}`))
        .catch((err) => {
            console.warn('⚠️  Redis subscriber connection failed:', err.message);
            console.log('ℹ️  Running in single-server mode (no Redis)');
        });

    return subscriber;
}

function getSubscriber() {
    return subscriber;
}

module.exports = { initSubscriber, getSubscriber };