// src/services/redisPublisher.js
const Redis = require('ioredis');

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

    publisher = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            // Exponential backoff with cap at 30 seconds, never stop retrying
            const delay = Math.min(times * 500, 30000);
            console.log(`⏳ Redis publisher retry #${times} in ${delay}ms`);
            return delay;
        },
        lazyConnect: true,
        enableReadyCheck: true,
        reconnectOnError(err) {
            // Reconnect on connection reset errors
            const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
            return targetErrors.some(e => err.message.includes(e));
        }
    });

    publisher.on('error', (err) => {
        console.warn('⚠️  Redis publisher error:', err.message);
    });

    publisher.on('connect', () => {
        console.log('✅ Redis publisher connected');
        reconnecting = false;
    });

    publisher.on('close', () => {
        console.warn('⚠️  Redis publisher connection closed');
    });

    publisher.on('reconnecting', () => {
        if (!reconnecting) {
            console.log('🔄 Redis publisher reconnecting...');
            reconnecting = true;
        }
    });

    publisher.on('ready', () => {
        console.log('✅ Redis publisher ready');
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
        console.warn('⚠️  Redis publish failed:', err.message);
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