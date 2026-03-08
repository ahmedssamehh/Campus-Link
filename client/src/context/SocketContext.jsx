// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    // ─── Unread message tracking ─────────────────────────────
    // Map<sourceId, { count: number, lastMessage: string, senderName: string, type: 'group'|'private' }>
    const [unreadMessages, setUnreadMessages] = useState({});
    // Tracks which chat/group the user is currently viewing (so we don't count those as unread)
    const activeViewRef = useRef(null);

    const currentUserId = (user?._id || user?.id)?.toString();
    // Use a ref so that the socket event handler always reads the latest value
    const currentUserIdRef = useRef(currentUserId);
    currentUserIdRef.current = currentUserId;

    // Set active view (called by chat pages when they open a conversation)
    const setActiveView = useCallback((sourceId) => {
        activeViewRef.current = sourceId;
        // Clear unread for this source
        if (sourceId) {
            setUnreadMessages((prev) => {
                if (!prev[sourceId]) return prev;
                const next = { ...prev };
                delete next[sourceId];
                return next;
            });
        }
    }, []);

    // Clear unread for a specific source
    const clearUnread = useCallback((sourceId) => {
        setUnreadMessages((prev) => {
            if (!prev[sourceId]) return prev;
            const next = { ...prev };
            delete next[sourceId];
            return next;
        });
    }, []);

    // Get total unread count
    const totalUnreadChat = Object.values(unreadMessages)
        .filter((u) => u.type === 'private')
        .reduce((sum, u) => sum + u.count, 0);

    const totalUnreadGroups = Object.values(unreadMessages)
        .filter((u) => u.type === 'group')
        .reduce((sum, u) => sum + u.count, 0);

    const totalUnread = totalUnreadChat + totalUnreadGroups;

    // ─── Connect / Disconnect ────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) {
            // Disconnect if user logs out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            return;
        }

        const token = localStorage.getItem('campusLinkToken');
        if (!token) return;

        // Create socket connection
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

        // ─── Track unread messages globally ─────────────────
        socket.on('newMessage', (msg) => {
            const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
            const senderName = typeof msg.sender === 'object' ? msg.sender.name : msg.senderName || 'Someone';
            const msgContent = msg.content || msg.text || '';

            // Don't count own messages (use ref to avoid stale closure)
            if (senderId === currentUserIdRef.current) return;

            let sourceId;
            let msgType;

            if (msg.group) {
                // Group message
                sourceId = msg.group;
                msgType = 'group';
            } else if (msg.receiver) {
                // Private message — source is the sender (the other user)
                sourceId = senderId;
                msgType = 'private';
            } else {
                return;
            }

            // Don't count if user is currently viewing this conversation
            if (activeViewRef.current === sourceId) return;

            setUnreadMessages((prev) => {
                const existing = prev[sourceId] || { count: 0, type: msgType };
                return {
                    ...prev,
                    [sourceId]: {
                        count: existing.count + 1,
                        lastMessage: msgContent.substring(0, 50),
                        senderName,
                        type: msgType,
                        timestamp: new Date().toISOString(),
                    },
                };
            });
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
