// src/services/redisPublisher.js
const Redis = require('ioredis');

const CHANNEL = 'chat_messages';

let publisher = null;

/**
 * Initialize Redis publisher.
 * Falls back gracefully when Redis is unavailable (single-server mode).
 */
function getPublisher() {
    if (publisher) return publisher;

    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    publisher = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 5) {
                console.warn('⚠️  Redis publisher: max retries reached, operating without Redis');
                return null; // stop retrying
            }
            return Math.min(times * 200, 2000);
        },
        lazyConnect: true
    });

    publisher.on('error', (err) => {
        console.warn('⚠️  Redis publisher error:', err.message);
    });

    publisher.on('connect', () => {
        console.log('✅ Redis publisher connected');
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

module.exports = { getPublisher, publishMessage, CHANNEL };