// src/workers/chat.worker.js
const Message = require('../models/Message');
const logger = require('../utils/logger');

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
 *  2. Deduplicate via clientMessageId
 *  3. Save to MongoDB
 *  4. Mark as delivered to online users
 *  5. Broadcast via Socket.io to the correct room
 *
 * @param {Object} payload - { sender, senderName, group, receiver, content, type, clientMessageId, attachments, timestamp }
 * @param {import('socket.io').Server} io - Socket.io server instance
 */
async function processMessage(payload, io) {
    const { sender, senderName, group, receiver, content, type = 'text', clientMessageId, attachments } = payload;

    // ── Validate ─────────────────────────────────────────────
    if (!sender || !content) {
        logger.error('Worker: invalid payload (missing sender or content)');
        return;
    }
    if (!group && !receiver) {
        logger.error('Worker: invalid payload (missing group and receiver)');
        return;
    }

    try {
        // ── Deduplicate via clientMessageId ───────────────────
        if (clientMessageId) {
            const existing = await Message.findOne({ clientMessageId }).select('_id');
            if (existing) {
                logger.debug(`Duplicate message skipped: ${clientMessageId}`);
                return;
            }
        }

        // ── Determine online recipients for delivery status ──
        const onlineUsers = io._onlineUsers || new Map();
        const deliveredTo = [sender]; // sender always counts as delivered

        if (receiver) {
            // Private message: check if receiver is online
            if (onlineUsers.has(receiver.toString())) {
                deliveredTo.push(receiver);
            }
        }

        // ── Persist to MongoDB ───────────────────────────────
        const message = await Message.create({
            sender,
            group: group || undefined,
            receiver: receiver || undefined,
            content,
            type,
            readBy: [sender],
            deliveredTo,
            clientMessageId: clientMessageId || undefined,
            attachments: attachments || []
        });

        // Populate sender info for the broadcast
        await message.populate('sender', 'name email profilePhoto');

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
            readBy: message.readBy,
            deliveredTo: message.deliveredTo,
            reactions: message.reactions || [],
            edited: message.edited,
            deleted: message.deleted,
            attachments: message.attachments || [],
            clientMessageId: message.clientMessageId || null,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt
        };

        // ── Broadcast to the correct room ────────────────────
        if (group) {
            // Group message → emit to group room
            io.to(group.toString()).emit('newMessage', messageData);

            // For group messages, mark as delivered to all online members
            const groupMembers = [];
            const sockets = await io.in(group.toString()).fetchSockets();
            sockets.forEach(s => {
                if (s.user && s.user._id !== sender) {
                    groupMembers.push(s.user._id);
                }
            });

            if (groupMembers.length > 0) {
                await Message.updateOne({ _id: message._id }, { $addToSet: { deliveredTo: { $each: groupMembers } } });
            }
        } else if (receiver) {
            // Private message → emit to both users' personal rooms + private room
            const roomId = getPrivateRoomId(sender, receiver);
            io.to(sender.toString()).to(receiver.toString()).to(roomId).emit('newMessage', messageData);

            // Emit delivery status to sender if receiver is online
            if (deliveredTo.includes(receiver)) {
                io.to(sender.toString()).emit('messagesDelivered', {
                    messageIds: [message._id.toString()],
                    deliveredTo: receiver,
                    deliveredAt: new Date().toISOString()
                });
            }
        }

        logger.info(`Message saved & broadcast: ${senderName} → ${group ? 'group:' + group : 'user:' + receiver}`);
    } catch (err) {
        logger.error('Worker: failed to process message:', err.message);
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

    logger.info('Chat worker initialized');
}

module.exports = { initChatWorker, processMessage };
