import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from '../../api/axios';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';

const Chat = () => {
  const { user } = useAuth();
  const { onlineUsers, onNewMessage, connected, unreadMessages, setActiveView, clearUnread } = useSocket();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUserId = (user?._id || user?.id)?.toString();

  const fetchAvailableUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/chats/available-users');
      if (response.data.success) {
        // Map each available user to a chat entry shape
        const chatEntries = response.data.users.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          lastMessage: '',
          lastMessageTime: '',
          unreadCount: 0,
          isOnline: onlineUsers.has(u._id),
          messages: [],
        }));
        setChats(chatEntries);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [onlineUsers]);

  useEffect(() => {
    fetchAvailableUsers();
  }, [fetchAvailableUsers]);

  // Update online status when onlineUsers changes
  useEffect(() => {
    setChats((prev) =>
      prev.map((chat) => ({
        ...chat,
        isOnline: onlineUsers.has(chat.id),
      }))
    );
    // Also update activeChat if it exists
    setActiveChat((prev) =>
      prev ? { ...prev, isOnline: onlineUsers.has(prev.id) } : null
    );
  }, [onlineUsers]);

  // Listen for new messages to update last message preview in chat list
  useEffect(() => {
    const unsubscribe = onNewMessage((msg) => {
      // For private messages (no group), update the chat list preview
      if (!msg.group) {
        const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
        const otherUserId = senderId === currentUserId ? msg.receiver : senderId;

        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id === otherUserId) {
              return {
                ...chat,
                lastMessage: msg.content || msg.text || '',
                lastMessageTime: msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              };
            }
            return chat;
          })
        );
      }
    });

    return unsubscribe;
  }, [onNewMessage, currentUserId]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setActiveView(chat.id, 'private');  // Mark this conversation as being viewed → clears unread
  };

  // Clear active view when leaving the chat page
  useEffect(() => {
    return () => setActiveView(null, 'private');
  }, [setActiveView]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Chat with your classmates and study groups</p>
          </div>
          {/* Connection indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat List */}
        <div className="w-full md:w-96 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex-shrink-0 overflow-hidden flex flex-col">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          {error && (
            <div className="m-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {!loading && !error && chats.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No contacts yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Join a study group to start chatting with classmates
              </p>
            </div>
          )}
          {!loading && chats.length > 0 && (
            <ChatList
              chats={chats}
              activeChat={activeChat}
              onSelectChat={handleSelectChat}
              unreadMessages={unreadMessages.private}
            />
          )}
        </div>

        {/* Right Section - Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow chat={activeChat} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
};

export default Chat;

