// src/socket/chat.socket.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const ChatMembership = require('../models/ChatMembership');
const { publishMessage } = require('../services/redisPublisher');
const { checkRateLimit, resetRateLimit } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const { isWithinEditWindow, isTextMessageEditable } = require('../constants/messaging');

// Track connected users: Map<userId, Set<socketId>>
const onlineUsers = new Map();

// Track last seen times: Map<userId, Date>
const lastSeenTimes = new Map();

// Dedup: track recently processed clientMessageIds: Map<clientMessageId, timestamp>
const recentClientMessageIds = new Map();
const DEDUP_WINDOW_MS = 30000; // 30 seconds dedup window

// Cleanup dedup cache periodically
setInterval(() => {
    const now = Date.now();
    for (const [id, ts] of recentClientMessageIds.entries()) {
        if (now - ts > DEDUP_WINDOW_MS) {
            recentClientMessageIds.delete(id);
        }
    }
}, 60000);

/**
 * Compute a consistent private room ID from two user IDs.
 * Always sorts to guarantee both users get the same room.
 */
function getPrivateRoomId(userA, userB) {
    const sorted = [userA.toString(), userB.toString()].sort();
    return `private:${sorted[0]}-${sorted[1]}`;
}

/**
 * Initialize Socket.io on the given HTTP server.
 * Returns the io instance.
 */
function initSocketServer(httpServer) {
    const { Server } = require('socket.io');

    const allowedOrigins = [
        ...(process.env.CLIENT_URL || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
        'http://localhost:3000',
        'http://localhost:3001',
    ];

    function isOriginAllowed(origin) {
        if (allowedOrigins.includes(origin)) return true;
        if (/^https:\/\/campus-link[a-z0-9-]*\.vercel\.app$/.test(origin)) return true;
        return false;
    }

    const io = new Server(httpServer, {
        cors: {
            origin(origin, callback) {
                if (!origin || isOriginAllowed(origin)) {
                    return callback(null, true);
                }
                logger.warn('Socket.IO blocked by CORS: %s', origin);
                return callback(new Error('Origin not allowed'));
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // ─── Authentication middleware ───────────────────────────
    io.use(async(socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('name email role');

            if (!user) {
                return next(new Error('User not found'));
            }

            // Attach user to socket
            socket.user = {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            };

            next();
        } catch (err) {
            logger.error('Socket auth error:', err.message);
            next(new Error('Invalid token'));
        }
    });

    // ─── Connection handler ─────────────────────────────────
    io.on('connection', (socket) => {
        const userId = socket.user._id;
        logger.info(`Socket connected: ${socket.user.name} (${userId})`);

        // Track online status
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        // ── Auto-join personal room (for direct message delivery) ──
        socket.join(userId);

        // ── Auto-join all groups the user belongs to ─────────
        Group.find({ members: userId }).select('_id').then((groups) => {
            groups.forEach((g) => {
                const gid = g._id.toString();
                socket.join(gid);
                socket.join(`group:${gid}`);
            });
            logger.info(`Auto-joined ${groups.length} group room(s) for ${socket.user.name}`);
        }).catch((err) => {
            logger.error('Auto-join groups error:', err.message);
        });

        // Send the full list of currently online users to the newly connected client
        const onlineUserIds = Array.from(onlineUsers.keys());
        socket.emit('onlineUsersList', onlineUserIds);

        // Broadcast online status to everyone else
        io.emit('userOnline', { userId, name: socket.user.name });

        // Deliver pending messages (mark as delivered for user who just came online)
        deliverPendingMessages(userId, io);

        // ── joinGroup ────────────────────────────────────────
        socket.on('joinGroup', async(groupId, callback) => {
            try {
                // Verify membership
                const group = await Group.findById(groupId).select('members name');
                if (!group) {
                    if (callback) callback({ error: 'Group not found' });
                    return;
                }

                const isMember = group.members.some(
                    (m) => m.toString() === userId
                );
                if (!isMember) {
                    if (callback) callback({ error: 'You are not a member of this group' });
                    return;
                }

                // Join the socket room
                socket.join(groupId);
                socket.join(`group:${groupId}`);
                logger.debug(`${socket.user.name} joined group room: ${groupId}`);

                if (callback) callback({ success: true, groupName: group.name });
            } catch (err) {
                logger.error('joinGroup error:', err.message);
                if (callback) callback({ error: 'Failed to join group room' });
            }
        });

        // ── joinPrivate ──────────────────────────────────────
        socket.on('joinPrivate', async({ user1, user2 }, callback) => {
            try {
                // Make sure requesting user is one of the two
                if (userId !== user1.toString() && userId !== user2.toString()) {
                    if (callback) callback({ error: 'Unauthorized' });
                    return;
                }

                const roomId = getPrivateRoomId(user1, user2);
                socket.join(roomId);
                logger.debug(`${socket.user.name} joined private room: ${roomId}`);

                if (callback) callback({ success: true, roomId });
            } catch (err) {
                logger.error('joinPrivate error:', err.message);
                if (callback) callback({ error: 'Failed to join private room' });
            }
        });

        // ── sendMessage (with rate limiting + dedup) ─────────
        socket.on('sendMessage', async(data, callback) => {
            try {
                const { group, receiver, content, type = 'text', clientMessageId, attachments } = data;

                // Rate limiting
                const rateCheck = checkRateLimit(userId);
                if (!rateCheck.allowed) {
                    if (callback) callback({ error: `Rate limited. Try again in ${rateCheck.retryAfter}s` });
                    return;
                }

                // Duplicate prevention via clientMessageId
                if (clientMessageId) {
                    if (recentClientMessageIds.has(clientMessageId)) {
                        if (callback) callback({ success: true, deduplicated: true });
                        return;
                    }
                    recentClientMessageIds.set(clientMessageId, Date.now());
                }

                // Validate
                if (!content || content.trim() === '') {
                    if (callback) callback({ error: 'Message content is required' });
                    return;
                }
                if (!group && !receiver) {
                    if (callback) callback({ error: 'Must specify group or receiver' });
                    return;
                }
                if (group && receiver) {
                    if (callback) callback({ error: 'Cannot specify both group and receiver' });
                    return;
                }

                // Sanitize content (basic XSS prevention)
                const sanitized = content
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .trim()
                    .substring(0, 5000);

                const payload = {
                    sender: userId,
                    senderName: socket.user.name,
                    group: group || null,
                    receiver: receiver || null,
                    content: sanitized,
                    type,
                    clientMessageId: clientMessageId || null,
                    attachments: attachments || [],
                    timestamp: new Date().toISOString()
                };

                // Try to publish via Redis (for multi-instance scaling)
                const published = await publishMessage(payload);

                if (!published) {
                    // Single-server fallback: process directly
                    const { processMessage } = require('../workers/chat.worker');
                    await processMessage(payload, io);
                }

                if (callback) callback({ success: true });
                logger.info('chat.message.sent', {
                    scope: group ? 'group' : 'private',
                    userId: String(userId),
                });
            } catch (err) {
                logger.error('sendMessage error:', err.message);
                if (callback) callback({ error: 'Failed to send message' });
            }
        });

        // ── messagesSeen (read receipts) ─────────────────────
        socket.on('messagesSeen', async({ messageIds, group, privateChatUserId }, callback) => {
            try {
                if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
                    if (callback) callback({ error: 'messageIds required' });
                    return;
                }

                // Limit batch size
                const ids = messageIds.slice(0, 100);

                // Add user to readBy for these messages
                await Message.updateMany({ _id: { $in: ids }, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } });

                // Update ChatMembership lastSeen
                const chatId = group || (privateChatUserId ? getPrivateRoomId(userId, privateChatUserId) : null);
                const chatType = group ? 'group' : 'private';
                if (chatId) {
                    await ChatMembership.findOneAndUpdate({ user: userId, chatType, chatId }, { lastSeenAt: new Date(), lastSeenMessage: ids[ids.length - 1] }, { upsert: true });
                }

                // Emit read receipt to relevant room
                const readReceiptData = { userId, userName: socket.user.name, messageIds: ids };
                if (group) {
                    socket.to(group).emit('messagesRead', readReceiptData);
                } else if (privateChatUserId) {
                    const roomId = getPrivateRoomId(userId, privateChatUserId);
                    socket.to(roomId).emit('messagesRead', readReceiptData);
                }

                if (callback) callback({ success: true });
            } catch (err) {
                logger.error('messagesSeen error:', err.message);
                if (callback) callback({ error: 'Failed to mark messages as seen' });
            }
        });

        // ── addReaction ──────────────────────────────────────
        socket.on('addReaction', async({ messageId, emoji }, callback) => {
            try {
                if (!messageId || !emoji) {
                    if (callback) callback({ error: 'messageId and emoji required' });
                    return;
                }

                // Validate emoji length
                if (emoji.length > 8) {
                    if (callback) callback({ error: 'Invalid emoji' });
                    return;
                }

                const message = await Message.findById(messageId);
                if (!message) {
                    if (callback) callback({ error: 'Message not found' });
                    return;
                }

                // Remove existing reaction from this user on this message, then add new
                message.reactions = message.reactions.filter(
                    r => r.user.toString() !== userId
                );
                message.reactions.push({ user: userId, emoji });
                await message.save();

                // Broadcast to relevant room
                const reactionData = {
                    messageId,
                    userId,
                    userName: socket.user.name,
                    emoji,
                    reactions: message.reactions
                };

                if (message.group) {
                    io.to(message.group.toString()).emit('reactionUpdated', reactionData);
                } else if (message.receiver) {
                    const senderId = message.sender.toString();
                    const receiverId = message.receiver.toString();
                    const roomId = getPrivateRoomId(senderId, receiverId);
                    io.to(senderId).to(receiverId).to(roomId).emit('reactionUpdated', reactionData);
                }

                if (callback) callback({ success: true });
            } catch (err) {
                logger.error('addReaction error:', err.message);
                if (callback) callback({ error: 'Failed to add reaction' });
            }
        });

        // ── removeReaction ───────────────────────────────────
        socket.on('removeReaction', async({ messageId }, callback) => {
            try {
                if (!messageId) {
                    if (callback) callback({ error: 'messageId required' });
                    return;
                }

                const message = await Message.findById(messageId);
                if (!message) {
                    if (callback) callback({ error: 'Message not found' });
                    return;
                }

                message.reactions = message.reactions.filter(
                    r => r.user.toString() !== userId
                );
                await message.save();

                const reactionData = {
                    messageId,
                    userId,
                    reactions: message.reactions
                };

                if (message.group) {
                    io.to(message.group.toString()).emit('reactionUpdated', reactionData);
                } else if (message.receiver) {
                    const senderId = message.sender.toString();
                    const receiverId = message.receiver.toString();
                    const roomId = getPrivateRoomId(senderId, receiverId);
                    io.to(senderId).to(receiverId).to(roomId).emit('reactionUpdated', reactionData);
                }

                if (callback) callback({ success: true });
            } catch (err) {
                logger.error('removeReaction error:', err.message);
                if (callback) callback({ error: 'Failed to remove reaction' });
            }
        });

        // ── editMessage ──────────────────────────────────────
        socket.on('editMessage', async({ messageId, content }, callback) => {
            try {
                if (!messageId || !content || content.trim() === '') {
                    if (callback) callback({ error: 'messageId and content required' });
                    return;
                }

                const message = await Message.findById(messageId);
                if (!message) {
                    if (callback) callback({ error: 'Message not found' });
                    return;
                }

                // Only sender can edit
                if (message.sender.toString() !== userId) {
                    if (callback) callback({ error: 'You can only edit your own messages' });
                    return;
                }

                // Cannot edit deleted messages
                if (message.deleted) {
                    if (callback) callback({ error: 'Cannot edit a deleted message' });
                    return;
                }

                if (!isWithinEditWindow(message.createdAt)) {
                    if (callback) callback({ error: 'This message can no longer be edited (10 minute limit)' });
                    return;
                }

                if (!isTextMessageEditable(message)) {
                    if (callback) callback({ error: 'Only text messages can be edited' });
                    return;
                }

                // Sanitize
                const sanitized = content
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .trim()
                    .substring(0, 5000);

                message.content = sanitized;
                message.edited = true;
                message.editedAt = new Date();
                await message.save();

                const editData = {
                    messageId,
                    content: sanitized,
                    edited: true,
                    editedAt: message.editedAt
                };

                if (message.group) {
                    io.to(message.group.toString()).emit('messageEdited', editData);
                } else if (message.receiver) {
                    const senderId = message.sender.toString();
                    const receiverId = message.receiver.toString();
                    const roomId = getPrivateRoomId(senderId, receiverId);
                    io.to(senderId).to(receiverId).to(roomId).emit('messageEdited', editData);
                }

                if (callback) callback({ success: true });
            } catch (err) {
                logger.error('editMessage error:', err.message);
                if (callback) callback({ error: 'Failed to edit message' });
            }
        });

        // ── deleteMessage ────────────────────────────────────
        socket.on('deleteMessage', async({ messageId }, callback) => {
            try {
                if (!messageId) {
                    if (callback) callback({ error: 'messageId required' });
                    return;
                }

                const message = await Message.findById(messageId);
                if (!message) {
                    if (callback) callback({ error: 'Message not found' });
                    return;
                }

                // Only sender can delete
                if (message.sender.toString() !== userId) {
                    if (callback) callback({ error: 'You can only delete your own messages' });
                    return;
                }

                // Soft delete
                message.deleted = true;
                message.deletedAt = new Date();
                message.deletedBy = userId;
                message.content = 'This message was deleted';
                message.attachments = [];
                message.reactions = [];
                await message.save();

                const deleteData = {
                    messageId,
                    deletedBy: userId,
                    deletedAt: message.deletedAt
                };

                if (message.group) {
                    io.to(message.group.toString()).emit('messageDeleted', deleteData);
                } else if (message.receiver) {
                    const senderId = message.sender.toString();
                    const receiverId = message.receiver.toString();
                    const roomId = getPrivateRoomId(senderId, receiverId);
                    io.to(senderId).to(receiverId).to(roomId).emit('messageDeleted', deleteData);
                }

                if (callback) callback({ success: true });
            } catch (err) {
                logger.error('deleteMessage error:', err.message);
                if (callback) callback({ error: 'Failed to delete message' });
            }
        });

        // ── typing indicators (scoped to group room or private DM room only)
        socket.on('typing', ({ group, receiver }) => {
            const typingData = {
                userId,
                userName: socket.user.name
            };

            if (group) {
                const gid = typeof group === 'object' && group?.toString ? group.toString() : String(group);
                socket.to(gid).emit('userTyping', {...typingData, group: gid });
            } else if (receiver) {
                // Notify the peer via their personal room (userId) so typing works even before
                // they join the DM room — e.g. conversation list view.
                const recv = typeof receiver === 'object' && receiver?.toString ? receiver.toString() : String(receiver);
                socket.to(recv).emit('userTyping', {...typingData, receiver: recv });
            }
        });

        socket.on('stopTyping', ({ group, receiver }) => {
            const typingData = { userId };

            if (group) {
                const gid = typeof group === 'object' && group?.toString ? group.toString() : String(group);
                socket.to(gid).emit('userStopTyping', {...typingData, group: gid });
            } else if (receiver) {
                const recv = typeof receiver === 'object' && receiver?.toString ? receiver.toString() : String(receiver);
                socket.to(recv).emit('userStopTyping', {...typingData, receiver: recv });
            }
        });

        // ── Disconnect ───────────────────────────────────────
        socket.on('disconnect', () => {
            logger.info(`Socket disconnected: ${socket.user.name}`);

            // Clean up online tracking
            const sockets = onlineUsers.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    lastSeenTimes.set(userId, new Date());
                    io.emit('userOffline', { userId, lastSeen: new Date().toISOString() });
                }
            }
        });
    });

    // Store references for worker access
    io._onlineUsers = onlineUsers;
    io._getPrivateRoomId = getPrivateRoomId;
    io._lastSeenTimes = lastSeenTimes;

    return io;
}

/**
 * Mark pending messages as delivered for a user who just came online.
 */
async function deliverPendingMessages(userId, io) {
    try {
        // Find messages sent TO this user (private) that haven't been delivered
        const undelivered = await Message.find({
            receiver: userId,
            deliveredTo: { $ne: userId },
            deleted: { $ne: true }
        }).select('_id sender').limit(500);

        if (undelivered.length === 0) return;

        const messageIds = undelivered.map(m => m._id);

        // Mark as delivered
        await Message.updateMany({ _id: { $in: messageIds } }, { $addToSet: { deliveredTo: userId } });

        // Group by sender and notify each sender
        const bySender = {};
        undelivered.forEach(m => {
            const sid = m.sender.toString();
            if (!bySender[sid]) bySender[sid] = [];
            bySender[sid].push(m._id.toString());
        });

        for (const [senderId, msgIds] of Object.entries(bySender)) {
            io.to(senderId).emit('messagesDelivered', {
                messageIds: msgIds,
                deliveredTo: userId,
                deliveredAt: new Date().toISOString()
            });
        }

        logger.info(`Delivered ${undelivered.length} pending messages to ${userId}`);
    } catch (err) {
        logger.error('deliverPendingMessages error:', err.message);
    }
}

module.exports = { initSocketServer, getPrivateRoomId };