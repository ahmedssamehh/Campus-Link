import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
import axios from '../../api/axios';
import MessageBubble from '../../components/chat/MessageBubble';

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  indigo: 'from-indigo-500 to-indigo-600',
  pink: 'from-pink-500 to-pink-600',
  teal: 'from-teal-500 to-teal-600',
};
const colorKeys = Object.keys(colorClasses);

const roleMeta = {
  owner: { label: 'Owner', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  admin: { label: 'Admin', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  user:  { label: 'Member', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

const RoleBadge = ({ role }) => {
  const meta = roleMeta[role] || roleMeta.user;
  return (
    <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded ${meta.cls}`}>
      {meta.label}
    </span>
  );
};

const GroupChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { joinGroup, sendMessage, onNewMessage, connected, emitTyping, emitStopTyping, onUserTyping, onUserStopTyping, setActiveView } = useSocket();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUserId = (user?._id || user?.id)?.toString();

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/groups/${id}`);
      if (response.data.success) {
        setGroup(response.data.group);
      } else {
        setError('Group not found');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setForbidden(true);
      } else {
        setError(err.response?.data?.message || 'Failed to load group');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch message history from API
  const fetchMessages = useCallback(async () => {
    try {
      setMessagesLoading(true);
      const response = await axios.get(`/messages/group/${id}`);
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // Join socket room & fetch history once group is loaded
  useEffect(() => {
    if (!group || !connected) return;

    // Mark this group as actively viewed (clears unread count)
    setActiveView(id);

    // Join the socket room
    joinGroup(id).then(() => {
      console.log('Joined group socket room:', id);
    }).catch((err) => {
      console.error('Failed to join group room:', err.message);
    });

    // Fetch message history
    fetchMessages();

    // Clear active view on unmount
    return () => setActiveView(null);
  }, [group, connected, id, joinGroup, fetchMessages, setActiveView]);

  // Listen for new realtime messages
  useEffect(() => {
    const unsubscribe = onNewMessage((msg) => {
      // Only add messages for this group
      if (msg.group === id) {
        setMessages((prev) => {
          // Deduplicate by _id
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return unsubscribe;
  }, [id, onNewMessage]);

  // Listen for typing indicators
  useEffect(() => {
    const unsubTyping = onUserTyping(({ userName, group: typingGroup }) => {
      if (typingGroup === id) {
        setTypingUsers((prev) => {
          if (prev.includes(userName)) return prev;
          return [...prev, userName];
        });
      }
    });

    const unsubStopTyping = onUserStopTyping(({ userId: typingUserId, group: typingGroup }) => {
      if (typingGroup === id) {
        setTypingUsers((prev) => prev.filter((name) => name !== typingUserId));
      }
    });

    return () => {
      unsubTyping();
      unsubStopTyping();
    };
  }, [id, onUserTyping, onUserStopTyping]);

  const handleLeaveGroup = async () => {
    const confirmed = await showConfirm('Are you sure you want to leave this group?');
    if (!confirmed) return;

    try {
      setLeaving(true);
      const response = await axios.delete(`/groups/${id}/leave`);
      if (response.data.success) {
        showSuccess('You have left the group successfully');
        navigate('/groups');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to leave group');
    } finally {
      setLeaving(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (messageInput.trim() === '' || sending) return;

    try {
      setSending(true);
      await sendMessage({
        group: id,
        content: messageInput.trim(),
        type: 'text'
      });
      setMessageInput('');
      // Stop typing indicator
      emitStopTyping({ group: id });
    } catch (err) {
      showError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    // Emit typing
    emitTyping({ group: id });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping({ group: id });
    }, 2000);
  };

  // Pick a stable color from the group _id
  const groupColor = group
    ? colorKeys[parseInt(group._id?.slice(-2) || '0', 16) % colorKeys.length]
    : 'blue';
  const gradientClass = colorClasses[groupColor];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V7m0 0a4 4 0 10-8 0v4h2V7a2 2 0 014 0v4h2V7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            You are not a member of this group. Join the group first to access its content.
          </p>
          <button
            onClick={() => navigate('/groups')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Browse Groups
          </button>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error || 'Group not found'}</p>
          <button
            onClick={() => navigate('/groups')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const memberCount = group.members?.length || 0;

  return (
    <div className="h-screen flex flex-col">
      {/* Group Header */}
      <div className={`bg-gradient-to-r ${gradientClass} text-white px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/groups')}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition duration-150"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="text-sm text-white text-opacity-90">
                {memberCount} member{memberCount !== 1 ? 's' : ''} • {group.subject}
                {connected && <span className="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full"></span>}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition duration-150"
              title="Group Actions"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              <span>Actions</span>
            </button>

            {/* Dropdown Menu */}
            {showActionsMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActionsMenu(false)}
                ></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
                  <button
                    onClick={() => {
                      setShowMembers(!showMembers);
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
                  >
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">{showMembers ? 'Hide' : 'Show'} Members ({memberCount})</span>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      handleLeaveGroup();
                    }}
                    disabled={leaving}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {leaving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    )}
                    <span className="text-sm font-medium">Leave Group</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-gray-500 font-medium">No messages yet</p>
                <p className="text-gray-400 text-sm">Be the first to start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const senderId = typeof message.sender === 'object'
                    ? message.sender?._id?.toString()
                    : message.sender;
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
              <div className="mt-2 text-sm text-gray-500 italic">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="bg-white border-t px-6 py-4">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
              <input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                placeholder={connected ? "Type a message..." : "Connecting..."}
                disabled={!connected}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!connected || sending || messageInput.trim() === ''}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Members Sidebar */}
        {showMembers && (
          <div className="w-72 bg-white border-l dark:bg-gray-800 dark:border-gray-700 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Group Members ({memberCount})
            </h3>
            <div className="space-y-3">
              {group.members && group.members.length > 0 ? (
                group.members.map((member) => {
                  const memberId = member._id?.toString();
                  const currentUserId = (user?._id || user?.id)?.toString();
                  const isCurrentUser = memberId === currentUserId;
                  return (
                    <div key={member._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {member.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {member.name}{isCurrentUser ? ' (You)' : ''}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <RoleBadge role={member.role} />
                          {isCurrentUser && (
                            <span className="text-xs text-gray-400">you</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No members found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChat;
