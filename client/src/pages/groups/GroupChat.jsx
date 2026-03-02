import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showMembers, setShowMembers] = useState(false);

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

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() === '') return;
    const newMessage = {
      id: messages.length + 1,
      text: messageInput,
      sender: user?.name || 'You',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isSent: true,
    };
    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
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
                {group.createdBy && group.createdBy.name && (
                  <span className="opacity-80"> • Created by {group.createdBy.name}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition duration-150 ${
                showMembers
                  ? 'bg-white text-blue-700'
                  : 'hover:bg-white hover:bg-opacity-20 text-white'
              }`}
              title="Toggle Members"
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Members ({memberCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gray-300 text-gray-700 text-xs px-4 py-1 rounded-full">Today</div>
            </div>
            {messages.length === 0 ? (
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
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isSent={message.sender === (user?.name || 'You')}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="bg-white border-t px-6 py-4">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition duration-150"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
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
