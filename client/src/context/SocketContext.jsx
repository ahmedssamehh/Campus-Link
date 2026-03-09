// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from '../api/axios';

const SocketContext = createContext(null);

const SOCKET_URL = 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    // ─── Unread message tracking ─────────────────────────────
    // { groups: { groupId: count }, private: { userId: count } }
    const [unreadMessages, setUnreadMessages] = useState({ groups: {}, private: {} });
    // Tracks which chat/group the user is currently viewing
    const activeViewRef = useRef(null);

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
            console.error('Failed to fetch unread counts:', err.message);
        }
    }, [isAuthenticated]);

    // Fetch on mount and when auth changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadCounts();
        } else {
            setUnreadMessages({ groups: {}, private: {} });
        }
    }, [isAuthenticated, fetchUnreadCounts]);

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
        axios.patch(endpoint).catch((err) => {
            console.error('Failed to mark as read:', err.message);
        });
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
            reconnectionAttempts: 10,
            timeout: 20000
        });

        socket.on('connect', () => {
            console.log('🔌 Socket connected:', socket.id);
            setConnected(true);
        });

        socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            setConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.warn('Socket connection error:', err.message);
            setConnected(false);
        });

        // Track online users
        socket.on('userOnline', ({ userId }) => {
            setOnlineUsers((prev) => new Set([...prev, userId]));
        });

        socket.on('userOffline', ({ userId }) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
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
            const currentUserId = user?._id || user?.id;
            socketRef.current.emit('joinPrivate', {
                user1: currentUserId,
                user2: otherUserId
            }, (response) => {
                if (response.error) reject(new Error(response.error));
                else resolve(response);
            });
        });
    }, [user]);

    // ─── Send a message ──────────────────────────────────────
    const sendMessage = useCallback((data) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current?.connected) {
                return reject(new Error('Socket not connected'));
            }
            socketRef.current.emit('sendMessage', data, (response) => {
                if (response.error) reject(new Error(response.error));
                else resolve(response);
            });
        });
    }, []);

    // ─── Listen for new messages ─────────────────────────────
    const onNewMessage = useCallback((handler) => {
        if (!socketRef.current) return () => {};
        socketRef.current.on('newMessage', handler);
        return () => socketRef.current?.off('newMessage', handler);
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

    const value = {
        socket: socketRef.current,
        connected,
        onlineUsers,
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
        emitTyping,
        emitStopTyping,
        onUserTyping,
        onUserStopTyping
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
