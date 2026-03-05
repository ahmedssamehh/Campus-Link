// src/workers/chat.worker.js
const Message = require('../models/Message');

/**
 * Compute consistent private room ID (same logic as chat.socket.js).
 */
function getPrivateRoomId(userA, userB) {
    const sorted = [userA.toString(), userB.toString()].sort();
    return `private:${sorted[0]}-${sorted[1]}`;
}

/**
 * Process an incoming chat message:
 *  1. Validate the payload
 *  2. Save to MongoDB
 *  3. Broadcast via Socket.io to the correct room
 *
 * @param {Object} payload - { sender, senderName, group, receiver, content, type, timestamp }
 * @param {import('socket.io').Server} io - Socket.io server instance
 */
async function processMessage(payload, io) {
    const { sender, senderName, group, receiver, content, type = 'text' } = payload;

    // ── Validate ─────────────────────────────────────────────
    if (!sender || !content) {
        console.error('❌ Worker: invalid payload (missing sender or content)');
        return;
    }
    if (!group && !receiver) {
        console.error('❌ Worker: invalid payload (missing group and receiver)');
        return;
    }

    try {
        // ── Persist to MongoDB ───────────────────────────────
        const message = await Message.create({
            sender,
            group: group || undefined,
            receiver: receiver || undefined,
            content,
            type
        });

        // Populate sender info for the broadcast
        await message.populate('sender', 'name email');

        // Build the message object to emit
        const messageData = {
            _id: message._id,
            sender: {
                _id: message.sender._id,
                name: message.sender.name,
                email: message.sender.email
            },
            group: message.group || null,
            receiver: message.receiver || null,
            content: message.content,
            type: message.type,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt
        };

        // ── Broadcast to the correct room ────────────────────
        if (group) {
            // Group message → emit to group room
            io.to(group.toString()).emit('newMessage', messageData);
        } else if (receiver) {
            // Private message → emit to private room
            const roomId = getPrivateRoomId(sender, receiver);
            io.to(roomId).emit('newMessage', messageData);
        }

        console.log(`💬 Message saved & broadcast: ${senderName} → ${group ? 'group:' + group : 'user:' + receiver}`);
    } catch (err) {
        console.error('❌ Worker: failed to process message:', err.message);
    }
}

/**
 * Initialize the worker. Called once at server startup.
 * Subscribes to Redis channel and processes incoming messages.
 *
 * @param {import('socket.io').Server} io - Socket.io server instance
 */
function initChatWorker(io) {
    const { initSubscriber } = require('../services/redisSubscriber');

    initSubscriber(async(payload) => {
        await processMessage(payload, io);
    });

    console.log('✅ Chat worker initialized');
}

module.exports = { initChatWorker, processMessage };