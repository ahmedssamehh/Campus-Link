import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from '../../components/chat/MessageBubble';

// Mock group data
const mockGroupData = {
  1: {
    id: 1,
    name: 'Computer Science Study Group',
    subject: 'Computer Science',
    members: 24,
    color: 'blue',
  },
  2: {
    id: 2,
    name: 'Mathematics Study Group',
    subject: 'Mathematics',
    members: 18,
    color: 'green',
  },
  3: {
    id: 3,
    name: 'Physics Lab Partners',
    subject: 'Physics',
    members: 15,
    color: 'purple',
  },
};

// Mock messages for group chat
const mockGroupMessages = [
  { id: 1, text: 'Hey everyone! Ready for the study session?', sender: 'Mike Chen', time: '10:00 AM', isSent: false },
  { id: 2, text: 'Yes! I have some questions about the last lecture', sender: 'Sarah Johnson', time: '10:05 AM', isSent: false },
  { id: 3, text: 'I can help with that', sender: 'You', time: '10:07 AM', isSent: true },
  { id: 4, text: 'Great! Can someone explain recursion?', sender: 'Amy Lee', time: '10:10 AM', isSent: false },
  { id: 5, text: 'Sure! Let me break it down...', sender: 'Mike Chen', time: '10:12 AM', isSent: false },
  { id: 6, text: 'Thanks everyone! This is really helpful', sender: 'Sarah Johnson', time: '10:20 AM', isSent: false },
];

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
};

const GroupChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState(mockGroupMessages);
  const [messageInput, setMessageInput] = useState('');
  const [showMembers, setShowMembers] = useState(false);

  const group = mockGroupData[id] || mockGroupData[1];

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

    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Group Header */}
      <div className={`bg-gradient-to-r ${colorClasses[group.color]} text-white px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/groups')}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition duration-150"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="text-sm text-white text-opacity-90">{group.members} members • {group.subject}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition duration-150"
            >
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </button>
            <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition duration-150">
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
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {/* Date Divider */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gray-300 text-gray-700 text-xs px-4 py-1 rounded-full">
                Today
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isSent={message.sender === (user?.name || 'You')}
                />
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-white border-t px-6 py-4">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition duration-150"
              >
                <svg
                  className="h-6 w-6 text-gray-600"
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
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition duration-150"
              >
                <svg
                  className="h-6 w-6 text-gray-600"
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
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition duration-150"
              >
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
              </button>
            </form>
          </div>
        </div>

        {/* Members Sidebar (Optional) */}
        {showMembers && (
          <div className="w-80 bg-white border-l p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Members</h3>
            <div className="space-y-3">
              {['Mike Chen', 'Sarah Johnson', 'Amy Lee', 'John Smith', 'Emma Davis', user?.name || 'You'].map((member, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {member.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member}</p>
                    <p className="text-xs text-gray-500">
                      {member === (user?.name || 'You') ? 'You' : 'Member'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChat;
