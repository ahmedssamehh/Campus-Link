import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import axios from '../../api/axios';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ chat, currentUserId }) => {
  const { joinPrivate, sendMessage, onNewMessage, connected, emitTyping, emitStopTyping, onUserTyping, onUserStopTyping } = useSocket();
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch message history from API
  const fetchMessages = useCallback(async (userId) => {
    try {
      setMessagesLoading(true);
      const response = await axios.get(`/messages/private/${userId}`);
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch private messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Join private room & fetch history when chat is selected
  useEffect(() => {
    if (!chat || !connected) return;

    // Reset state for new chat
    setMessages([]);
    setTypingUsers([]);
    setMessageInput('');

    // Join the private socket room
    joinPrivate(chat.id).then(() => {
      console.log('Joined private room with:', chat.name);
    }).catch((err) => {
      console.error('Failed to join private room:', err.message);
    });

    // Fetch message history
    fetchMessages(chat.id);
  }, [chat?.id, connected, joinPrivate, fetchMessages]);

  // Listen for new realtime messages
  useEffect(() => {
    if (!chat) return;

    const unsubscribe = onNewMessage((msg) => {
      // Only add messages for this private conversation (no group field)
      if (msg.group) return;

      const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
      const receiverId = msg.receiver;

      // Check if this message belongs to this conversation
      const isRelevant =
        (senderId === currentUserId && receiverId === chat.id) ||
        (senderId === chat.id && receiverId === currentUserId);

      if (isRelevant) {
        setMessages((prev) => {
          // Deduplicate by _id
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return unsubscribe;
  }, [chat?.id, currentUserId, onNewMessage]);

  // Listen for typing indicators
  useEffect(() => {
    if (!chat) return;

    const unsubTyping = onUserTyping(({ userName, receiver }) => {
      if (receiver) {
        setTypingUsers((prev) => {
          if (prev.includes(userName)) return prev;
          return [...prev, userName];
        });
      }
    });

    const unsubStopTyping = onUserStopTyping(({ receiver }) => {
      if (receiver) {
        setTypingUsers([]);
      }
    });

    return () => {
      unsubTyping();
      unsubStopTyping();
    };
  }, [chat?.id, onUserTyping, onUserStopTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (messageInput.trim() === '' || sending || !connected) return;

    try {
      setSending(true);
      await sendMessage({
        receiver: chat.id,
        content: messageInput.trim(),
        type: 'text',
      });
      setMessageInput('');
      // Stop typing indicator
      emitStopTyping({ receiver: chat.id });
    } catch (err) {
      console.error('Failed to send message:', err.message);
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    // Emit typing
    emitTyping({ receiver: chat.id });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping({ receiver: chat.id });
    }, 2000);
  };

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Select a conversation</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Choose a chat from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-semibold">
                {chat.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {chat.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{chat.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {chat.isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Connection indicator */}
          <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition duration-150">
            <svg
              className="h-6 w-6 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition duration-150">
            <svg
              className="h-6 w-6 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
        {messagesLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  No messages yet. Say hello! 👋
                </p>
              </div>
            )}
            {messages.map((message) => {
              const senderId = typeof message.sender === 'object'
                ? message.sender._id?.toString()
                : message.sender?.toString();
              return (
                <MessageBubble
                  key={message._id || message.id}
                  message={message}
                  isSent={senderId === currentUserId}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition duration-150"
          >
            <svg
              className="h-6 w-6 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder={connected ? 'Type a message...' : 'Connecting...'}
            disabled={!connected}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 disabled:opacity-50"
          />
          <button
            type="button"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition duration-150"
          >
            <svg
              className="h-6 w-6 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <button
            type="submit"
            disabled={!messageInput.trim() || sending || !connected}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
