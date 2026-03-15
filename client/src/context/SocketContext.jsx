// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from '../api/axios';

const SocketContext = createContext(null);

const SOCKET_URL = 'http://localhost:5000';

// Generate unique client message ID for dedup
let messageCounter = 0;
function generateClientMessageId(userId) {
    messageCounter += 1;
    return `${userId}-${Date.now()}-${messageCounter}`;
}

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [lastSeenMap, setLastSeenMap] = useState({}); // userId → ISO date string

    // ─── Unread message tracking ─────────────────────────────
    // { groups: { groupId: count }, private: { userId: count } }
    const [unreadMessages, setUnreadMessages] = useState({ groups: {}, private: {} });
    // Tracks which chat/group the user is currently viewing
    const activeViewRef = useRef(null);

    // ─── Unread announcement tracking ────────────────────────
    const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
    const seenAnnouncementIds = useRef(new Set());

    const currentUserId = (user?._id || user?.id)?.toString();
    const currentUserIdRef = useRef(currentUserId);
    currentUserIdRef.current = currentUserId;

    // ─── Fetch unread counts from API ───────────────────────
    const fetchUnreadCounts = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await axios.get('/messages/unread');
            if (res.data.success) {
                setUnreadMessages({
                    groups: res.data.groups || {},
                    private: res.data.private || {}
                });
            }
        } catch (err) {
        }
    }, [isAuthenticated]);

    const fetchUnreadAnnouncementsCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await axios.get('/announcements/unread-count');
            if (res.data.success) {
                setUnreadAnnouncements(res.data.unreadCount || 0);
            }
        } catch (err) {
        }
    }, [isAuthenticated]);

    // Fetch on mount and when auth changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadCounts();
            fetchUnreadAnnouncementsCount();
        } else {
            setUnreadMessages({ groups: {}, private: {} });
            setUnreadAnnouncements(0);
        }
    }, [isAuthenticated, fetchUnreadCounts, fetchUnreadAnnouncementsCount]);

    // Set active view + mark as read via API
    const setActiveView = useCallback((sourceId, type) => {
        activeViewRef.current = sourceId;
        if (!sourceId) return;

        // Clear locally immediately for instant UI response
        setUnreadMessages((prev) => {
            const bucket = type === 'group' ? 'groups' : 'private';
            if (!prev[bucket][sourceId]) return prev;
            const next = { ...prev, [bucket]: { ...prev[bucket] } };
            delete next[bucket][sourceId];
            return next;
        });

        // Mark as read on server
        const endpoint = type === 'group'
            ? `/messages/read/group/${sourceId}`
            : `/messages/read/private/${sourceId}`;
        axios.patch(endpoint).catch(() => {});
    }, []);

    // Clear unread for a specific source
    const clearUnread = useCallback((sourceId, type) => {
        setUnreadMessages((prev) => {
            const bucket = type === 'group' ? 'groups' : 'private';
            if (!prev[bucket][sourceId]) return prev;
            const next = { ...prev, [bucket]: { ...prev[bucket] } };
            delete next[bucket][sourceId];
            return next;
        });
    }, []);

    // Computed totals
    const totalUnreadChat = Object.values(unreadMessages.private).reduce((sum, c) => sum + c, 0);
    const totalUnreadGroups = Object.values(unreadMessages.groups).reduce((sum, c) => sum + c, 0);
    const totalUnread = totalUnreadChat + totalUnreadGroups;

    // ─── Connect / Disconnect ────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            return;
        }

        const token = localStorage.getItem('campusLinkToken');
        if (!token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000,
            reconnectionAttempts: Infinity,
            timeout: 20000
        });

        socket.on('connect', () => {
            setConnected(true);
            seenAnnouncementIds.current.clear();
            fetchUnreadCounts();
            fetchUnreadAnnouncementsCount();
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('connect_error', () => {
            setConnected(false);
        });

        // Track online users
        socket.on('userOnline', ({ userId }) => {
            setOnlineUsers((prev) => new Set([...prev, userId]));
        });

        socket.on('userOffline', ({ userId, lastSeen }) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
            if (lastSeen) {
                setLastSeenMap((prev) => ({ ...prev, [userId]: lastSeen }));
            }
        });

        // ─── Realtime unread announcement increment ─────────
        socket.on('newAnnouncement', (data) => {
            const annId = data && data._id;
            if (!annId) return;
            if (seenAnnouncementIds.current.has(annId)) return;
            seenAnnouncementIds.current.add(annId);
            setUnreadAnnouncements((prev) => prev + 1);
        });

        // ─── Realtime unread increment on new message ───────
        socket.on('newMessage', (msg) => {
            const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;

            // Don't count own messages
            if (senderId === currentUserIdRef.current) return;

            let sourceId;
            let bucket;

            if (msg.group) {
                sourceId = typeof msg.group === 'object' ? msg.group._id || msg.group : msg.group;
                bucket = 'groups';
            } else if (msg.receiver) {
                sourceId = senderId;
                bucket = 'private';
            } else {
                return;
            }

            // Don't count if user is currently viewing this conversation
            if (activeViewRef.current === sourceId) return;

            setUnreadMessages((prev) => ({
                ...prev,
                [bucket]: {
                    ...prev[bucket],
                    [sourceId]: (prev[bucket][sourceId] || 0) + 1
                }
            }));
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [isAuthenticated]);

    // ─── Join a group room ───────────────────────────────────
    const joinGroup = useCallback((groupId) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current?.connected) {
                return reject(new Error('Socket not connected'));
            }
            socketRef.current.emit('joinGroup', groupId, (response) => {
                if (response.error) reject(new Error(response.error));
                else resolve(response);
            });
        });
    }, []);

    // ─── Join a private room ─────────────────────────────────
    const joinPrivate = useCallback((otherUserId) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current?.connected) {
                return reject(new Error('Socket not connected'));
            }
            const uid = user?._id || user?.id;
            socketRef.current.emit('joinPrivate', {
                user1: uid,
                user2: otherUserId
            }, (response) => {
                if (response.error) reject(new Error(response.error));
                else resolve(response);
            });
        });
    }, [user]);

    // ─── Send a message (with clientMessageId for dedup) ─────
    const sendMessage = useCallback((data) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current?.connected) {
                return reject(new Error('Socket not connected'));
            }
            const clientMessageId = generateClientMessageId(currentUserIdRef.current);
            socketRef.current.emit('sendMessage', { ...data, clientMessageId }, (response) => {
                if (response.error) reject(new Error(response.error));
                else resolve({ ...response, clientMessageId });
            });
        });
    }, []);

    // ─── Listen for new messages ─────────────────────────────
    const onNewMessage = useCallback((handler) => {
        if (!socketRef.current) return () => {};
        socketRef.current.on('newMessage', handler);
        return () => socketRef.current?.off('newMessage', handler);
    }, [connected]);

    // ─── Message delivery status ─────────────────────────────
    const onMessagesDelivered = useCallback((handler) => {
        if (!socketRef.current) return () => {};
        socketRef.current.on('messagesDelivered', handler);
        return () => socketRef.current?.off('messagesDelivered', handler);
    }, [connected]);

    // ─── Read receipts ──────────────────────────────────────
    const emitMessagesSeen = useCallback((data) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current?.connected) {
                return reject(new Error('Socket not connected'));
            }
            socketRef.current.emit('messagesSeen', data, (response) => {
                if (response.error) reject(new Error(response.error));
                else resolve(response);
            });
        });
    }, []);

    const onMessagesRead = useCallback((handler) => {
        if (!socketRef.current) return () => {};
        socketRef.current.on('messagesRead', handler);
        return () => socketRef.current?.off('messagesRead', handler);
    }, [connected]);

    // ─── Reactions ───────────────────────────────────────────
    const emitAddReaction = useCallback((data) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current?.connected) {
                return reject(new Error('Socket not connected'));
            }
            socketRef.current.emit('addReaction', data, (response) => {
                if (response.error) reject(new Error(response.error));
                else resolve(response);
            });
        });
    }, []);

    const emitRemoveReaction = useCallback((data) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current?.connected) {
                return reject(new Error('Socket not connected'));
            }
            socketRef.current.emit('removeReaction', data, (response) => {
                if (response.error) reject(new Error(response.error));
                else resolve(response);
            });
        });
    }, []);

    const onReactionUpdated = useCallback((handler) => {
        if (!socketRef.current) return () => {};
        socketRef.current.on('reactionUpdated', handler);
        return () => socketRef.current?.off('reactionUpdated', handler);
    }, [connected]);

    // ─── Edit message ────────────────────────────────────────
    const emitEditMessage = useCallback((data) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current?.connected) {
                return reject(new Error('Socket not connected'));
            }
            socketRef.current.emit('editMessage', data, (response) => {
                if (response.error) reject(new Error(response.error));
                else resolve(response);
            });
        });
    }, []);

    const onMessageEdited = useCallback((handler) => {
        if (!socketRef.current) return () => {};
        socketRef.current.on('messageEdited', handler);
        return () => socketRef.current?.off('messageEdited', handler);
    }, [connected]);

    // ─── Delete message ──────────────────────────────────────
    const emitDeleteMessage = useCallback((data) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current?.connected) {
                return reject(new Error('Socket not connected'));
            }
            socketRef.current.emit('deleteMessage', data, (response) => {
                if (response.error) reject(new Error(response.error));
                else resolve(response);
            });
        });
    }, []);

    const onMessageDeleted = useCallback((handler) => {
        if (!socketRef.current) return () => {};
        socketRef.current.on('messageDeleted', handler);
        return () => socketRef.current?.off('messageDeleted', handler);
    }, [connected]);

    // ─── Typing indicators ──────────────────────────────────
    const emitTyping = useCallback((data) => {
        socketRef.current?.emit('typing', data);
    }, []);

    const emitStopTyping = useCallback((data) => {
        socketRef.current?.emit('stopTyping', data);
    }, []);

    const onUserTyping = useCallback((handler) => {
        if (!socketRef.current) return () => {};
        socketRef.current.on('userTyping', handler);
        return () => socketRef.current?.off('userTyping', handler);
    }, []);

    const onUserStopTyping = useCallback((handler) => {
        if (!socketRef.current) return () => {};
        socketRef.current.on('userStopTyping', handler);
        return () => socketRef.current?.off('userStopTyping', handler);
    }, []);

    // ─── New announcement listener ───────────────────────────
    const onNewAnnouncement = useCallback((handler) => {
        if (!socketRef.current) return () => {};
        socketRef.current.on('newAnnouncement', handler);
        return () => socketRef.current?.off('newAnnouncement', handler);
    }, [connected]);

    const value = {
        socket: socketRef.current,
        connected,
        onlineUsers,
        lastSeenMap,
        unreadMessages,
        totalUnread,
        totalUnreadChat,
        totalUnreadGroups,
        setActiveView,
        clearUnread,
        fetchUnreadCounts,
        joinGroup,
        joinPrivate,
        sendMessage,
        onNewMessage,
        // Delivery & read receipts
        onMessagesDelivered,
        emitMessagesSeen,
        onMessagesRead,
        // Reactions
        emitAddReaction,
        emitRemoveReaction,
        onReactionUpdated,
        // Edit & delete
        emitEditMessage,
        onMessageEdited,
        emitDeleteMessage,
        onMessageDeleted,
        // Typing
        emitTyping,
        emitStopTyping,
        onUserTyping,
        onUserStopTyping,
        // Announcements
        unreadAnnouncements,
        setUnreadAnnouncements,
        fetchUnreadAnnouncementsCount,
        onNewAnnouncement
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export default SocketContext;
