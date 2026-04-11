import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useNotification } from '../../context/NotificationContext';
import axios from '../../api/axios';
import MessageBubble from './MessageBubble';
import { getMediaUrl } from '../../utils/media';
import { isWithinEditWindow, isTextMessageEditable } from '../../utils/messageEdit';

const ChatWindow = ({ chat, currentUserId, onBack }) => {
  const { showError: notifyError } = useNotification();
  const {
    joinPrivate, sendMessage, onNewMessage, connected,
    emitTyping, emitStopTyping, onUserTyping, onUserStopTyping,
    onMessagesDelivered, emitMessagesSeen, onMessagesRead,
    emitAddReaction, emitRemoveReaction, onReactionUpdated,
    emitEditMessage, onMessageEdited,
    emitDeleteMessage, onMessageDeleted
  } = useSocket();

  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [headerImgError, setHeaderImgError] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Auto-scroll to bottom only for new messages at bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      scrollToBottom('auto');
      isInitialLoad.current = false;
    } else if (!loadingMore && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, loadingMore]);

  // Fetch message history from API
  const fetchMessages = useCallback(async (userId, before = null) => {
    try {
      if (!before) {
        setMessagesLoading(true);
        isInitialLoad.current = true;
      } else {
        setLoadingMore(true);
      }
      const params = before ? `?before=${before}&limit=50` : '?limit=50';
      const response = await axios.get(`/messages/private/${userId}${params}`);
      if (response.data.success) {
        if (before) {
          // Prepend older messages
          setMessages((prev) => [...response.data.messages, ...prev]);
        } else {
          setMessages(response.data.messages);
        }
        setHasMore(response.data.hasMore || false);
      }
    } catch (err) {
      if (!before) setError('Failed to load messages');
    } finally {
      setMessagesLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Join private room & fetch history when chat is selected
  useEffect(() => {
    if (!chat || !connected) return;

    // Reset state for new chat
    setMessages([]);
    setTypingUsers([]);
    setMessageInput('');
    setEditingMessage(null);
    setHasMore(false);
    setHeaderImgError(false);

    // Join the private socket room
    joinPrivate(chat.id).catch(() => {});

    // Fetch message history
    fetchMessages(chat.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id, connected, joinPrivate, fetchMessages]);

  // Infinite scroll - load older messages
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasMore || loadingMore || !chat) return;

    if (container.scrollTop < 100) {
      const oldestMessage = messages[0];
      if (oldestMessage?.createdAt) {
        fetchMessages(chat.id, oldestMessage.createdAt);
      }
    }
  }, [hasMore, loadingMore, messages, chat, fetchMessages]);

  // Listen for new realtime messages
  useEffect(() => {
    if (!chat) return;

    const unsubscribe = onNewMessage((msg) => {
      if (msg.group) return;

      const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
      const receiverId = msg.receiver;

      const isRelevant =
        (senderId === currentUserId && receiverId === chat.id) ||
        (senderId === chat.id && receiverId === currentUserId);

      if (isRelevant) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          // Also dedup by clientMessageId
          if (msg.clientMessageId && prev.some((m) => m.clientMessageId === msg.clientMessageId)) return prev;
          return [...prev, msg];
        });

        // Auto-mark as seen if from other user
        if (senderId !== currentUserId && msg._id) {
          emitMessagesSeen({ messageIds: [msg._id], privateChatUserId: chat.id }).catch(() => {});
        }
      }
    });

    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id, currentUserId, onNewMessage, emitMessagesSeen]);

  // Listen for delivery receipts
  useEffect(() => {
    if (!chat) return;
    const unsub = onMessagesDelivered(({ messageIds, deliveredTo, deliveredAt }) => {
      setMessages((prev) => prev.map((m) => {
        if (messageIds.includes(m._id?.toString())) {
          const newDelivered = [...(m.deliveredTo || [])];
          if (!newDelivered.includes(deliveredTo)) newDelivered.push(deliveredTo);
          return { ...m, deliveredTo: newDelivered };
        }
        return m;
      }));
    });
    return unsub;
  }, [chat?.id, onMessagesDelivered]);

  // Listen for read receipts
  useEffect(() => {
    if (!chat) return;
    const unsub = onMessagesRead(({ userId: readerId, messageIds }) => {
      setMessages((prev) => prev.map((m) => {
        if (messageIds.includes(m._id?.toString())) {
          const newReadBy = [...(m.readBy || [])];
          if (!newReadBy.includes(readerId)) newReadBy.push(readerId);
          return { ...m, readBy: newReadBy };
        }
        return m;
      }));
    });
    return unsub;
  }, [chat?.id, onMessagesRead]);

  // Listen for reactions
  useEffect(() => {
    if (!chat) return;
    const unsub = onReactionUpdated(({ messageId, reactions }) => {
      setMessages((prev) => prev.map((m) =>
        m._id === messageId ? { ...m, reactions } : m
      ));
    });
    return unsub;
  }, [chat?.id, onReactionUpdated]);

  // Listen for message edits
  useEffect(() => {
    if (!chat) return;
    const unsub = onMessageEdited(({ messageId, content, edited, editedAt }) => {
      setMessages((prev) => prev.map((m) =>
        m._id === messageId ? { ...m, content, edited, editedAt } : m
      ));
    });
    return unsub;
  }, [chat?.id, onMessageEdited]);

  // Listen for message deletions
  useEffect(() => {
    if (!chat) return;
    const unsub = onMessageDeleted(({ messageId, deletedAt }) => {
      setMessages((prev) => prev.map((m) =>
        m._id === messageId ? { ...m, deleted: true, content: 'This message was deleted', attachments: [], reactions: [] } : m
      ));
    });
    return unsub;
  }, [chat?.id, onMessageDeleted]);

  // Listen for typing indicators — only for THIS DM (typer must be chat.id, recipient must be me)
  useEffect(() => {
    if (!chat) return;

    const peerId = String(chat.id);
    const me = String(currentUserId);

    const unsubTyping = onUserTyping(({ userId: typingUserId, userName, receiver }) => {
      if (!receiver || String(typingUserId) === me) return;
      if (String(receiver) !== me) return;
      if (String(typingUserId) !== peerId) return;
      setTypingUsers((prev) => {
        if (prev.includes(userName)) return prev;
        return [...prev, userName];
      });
    });

    const unsubStopTyping = onUserStopTyping(({ userId: typingUserId, receiver }) => {
      if (!receiver || String(typingUserId) === me) return;
      if (String(receiver) !== me) return;
      if (String(typingUserId) !== peerId) return;
      setTypingUsers([]);
    });

    return () => {
      unsubTyping();
      unsubStopTyping();
    };
  }, [chat?.id, currentUserId, onUserTyping, onUserStopTyping]);

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
      emitStopTyping({ receiver: chat.id });
    } catch (err) {
    } finally {
      setSending(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await axios.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        await sendMessage({
          receiver: chat.id,
          content: files.length === 1 ? files[0].name : `${files.length} files`,
          type: 'file',
          attachments: res.data.attachments
        });
      }
    } catch (err) {
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle edit (only within server-enforced window; UI hides edit after 10 min)
  const handleStartEdit = (message) => {
    if (!isWithinEditWindow(message.createdAt) || !isTextMessageEditable(message)) return;
    setEditingMessage(message._id);
    setEditInput(message.content || message.text || '');
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditInput('');
  };

  const handleSaveEdit = async () => {
    if (!editInput.trim() || !editingMessage) return;
    try {
      await emitEditMessage({ messageId: editingMessage, content: editInput.trim() });
      setEditingMessage(null);
      setEditInput('');
    } catch (err) {
      notifyError(err.message || 'Failed to edit message');
    }
  };

  // Handle delete
  const handleDeleteMessage = async (messageId) => {
    try {
      await emitDeleteMessage({ messageId });
    } catch (err) {
    }
  };

  // Handle reaction
  const handleReaction = async (messageId, emoji) => {
    try {
      await emitAddReaction({ messageId, emoji });
    } catch (err) {
    }
  };

  const handleRemoveReaction = async (messageId) => {
    try {
      await emitRemoveReaction({ messageId });
    } catch (err) {
    }
  };

  // Handle typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    emitTyping({ receiver: chat.id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

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
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile back button */}
          {onBack && (
            <button onClick={onBack} className="md:hidden p-1 -ml-1 mr-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="relative">
            {chat.profilePhoto && !headerImgError ? (
              <img
                src={getMediaUrl(chat.profilePhoto)}
                alt={chat.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                onError={() => setHeaderImgError(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {chat.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900 p-3 sm:p-6"
      >
        {/* Load more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
        {hasMore && !loadingMore && (
          <div className="text-center py-2">
            <button
              onClick={() => {
                const oldest = messages[0];
                if (oldest?.createdAt) fetchMessages(chat.id, oldest.createdAt);
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Load older messages
            </button>
          </div>
        )}

        {messagesLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-red-500 text-sm">{error}</p>
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
                  currentUserId={currentUserId}
                  isEditing={editingMessage === message._id}
                  editInput={editInput}
                  onEditInputChange={(val) => setEditInput(val)}
                  onStartEdit={() => handleStartEdit(message)}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onDelete={() => handleDeleteMessage(message._id)}
                  onReaction={(emoji) => handleReaction(message._id, emoji)}
                  onRemoveReaction={() => handleRemoveReaction(message._id)}
                  chatType="private"
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 px-2 py-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
      </div>

      {/* Edit bar */}
      {editingMessage && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-t dark:border-gray-700 px-6 py-2 flex items-center justify-between">
          <span className="text-sm text-yellow-700 dark:text-yellow-300">Editing message</span>
          <button onClick={handleCancelEdit} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Cancel</button>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-3 md:px-6 py-3 md:py-4 pb-[env(safe-area-inset-bottom,0.75rem)]">
        <form onSubmit={editingMessage ? (e) => { e.preventDefault(); handleSaveEdit(); } : handleSendMessage} className="flex items-center space-x-3">
          {/* File upload button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !connected}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition duration-150 disabled:opacity-50"
          >
            {uploading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            ) : (
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
            )}
          </button>
          <input
            type="text"
            value={editingMessage ? editInput : messageInput}
            onChange={editingMessage ? (e) => setEditInput(e.target.value) : handleInputChange}
            placeholder={!connected ? 'Connecting...' : editingMessage ? 'Edit message...' : 'Type a message...'}
            disabled={!connected}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={editingMessage ? !editInput.trim() : (!messageInput.trim() || sending || !connected)}
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
