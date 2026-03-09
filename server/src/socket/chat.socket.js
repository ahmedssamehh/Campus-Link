// src/socket/chat.socket.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');
const { publishMessage } = require('../services/redisPublisher');

// Track connected users: Map<userId, Set<socketId>>
const onlineUsers = new Map();

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

    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
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
            console.error('Socket auth error:', err.message);
            next(new Error('Invalid token'));
        }
    });

    // ─── Connection handler ─────────────────────────────────
    io.on('connection', (socket) => {
        const userId = socket.user._id;
        console.log(`🔌 Socket connected: ${socket.user.name} (${userId})`);

        // Track online status
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        // Broadcast online status
        io.emit('userOnline', { userId, name: socket.user.name });

        // ── joinGroup ────────────────────────────────────────
        socket.on('joinGroup', async(groupId, callback) => {
            try {
                // Verify membership
                const group = await Group.findById(groupId).select('members name');
                if (!group) {
                    return callback ? .({ error: 'Group not found' });
                }

                const isMember = group.members.some(
                    (m) => m.toString() === userId
                );
                if (!isMember) {
                    return callback ? .({ error: 'You are not a member of this group' });
                }

                // Join the socket room
                socket.join(groupId);
                console.log(`📦 ${socket.user.name} joined group room: ${groupId}`);

                callback ? .({ success: true, groupName: group.name });
            } catch (err) {
                console.error('joinGroup error:', err.message);
                callback ? .({ error: 'Failed to join group room' });
            }
        });

        // ── joinPrivate ──────────────────────────────────────
        socket.on('joinPrivate', async({ user1, user2 }, callback) => {
            try {
                // Make sure requesting user is one of the two
                if (userId !== user1.toString() && userId !== user2.toString()) {
                    return callback ? .({ error: 'Unauthorized' });
                }

                const roomId = getPrivateRoomId(user1, user2);
                socket.join(roomId);
                console.log(`🔒 ${socket.user.name} joined private room: ${roomId}`);

                callback ? .({ success: true, roomId });
            } catch (err) {
                console.error('joinPrivate error:', err.message);
                callback ? .({ error: 'Failed to join private room' });
            }
        });

        // ── sendMessage ──────────────────────────────────────
        socket.on('sendMessage', async(data, callback) => {
            try {
                const { group, receiver, content, type = 'text' } = data;

                // Validate
                if (!content || content.trim() === '') {
                    return callback ? .({ error: 'Message content is required' });
                }
                if (!group && !receiver) {
                    return callback ? .({ error: 'Must specify group or receiver' });
                }
                if (group && receiver) {
                    return callback ? .({ error: 'Cannot specify both group and receiver' });
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
                    timestamp: new Date().toISOString()
                };

                // Try to publish via Redis (for multi-instance scaling)
                const published = await publishMessage(payload);

                if (!published) {
                    // Single-server fallback: process directly
                    const { processMessage } = require('../workers/chat.worker');
                    await processMessage(payload, io);
                }

                callback ? .({ success: true });
            } catch (err) {
                console.error('sendMessage error:', err.message);
                callback ? .({ error: 'Failed to send message' });
            }
        });

        // ── typing indicators ────────────────────────────────
        socket.on('typing', ({ group, receiver }) => {
            const typingData = {
                userId,
                userName: socket.user.name
            };

            if (group) {
                socket.to(group).emit('userTyping', {...typingData, group });
            } else if (receiver) {
                const roomId = getPrivateRoomId(userId, receiver);
                socket.to(roomId).emit('userTyping', {...typingData, receiver });
            }
        });

        socket.on('stopTyping', ({ group, receiver }) => {
            const typingData = { userId };

            if (group) {
                socket.to(group).emit('userStopTyping', {...typingData, group });
            } else if (receiver) {
                const roomId = getPrivateRoomId(userId, receiver);
                socket.to(roomId).emit('userStopTyping', {...typingData, receiver });
            }
        });

        // ── Disconnect ───────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.user.name}`);

            // Clean up online tracking
            const sockets = onlineUsers.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('userOffline', { userId });
                }
            }
        });
    });

    // Store references for worker access
    io._onlineUsers = onlineUsers;
    io._getPrivateRoomId = getPrivateRoomId;

    return io;
}

module.exports = { initSocketServer, getPrivateRoomId };