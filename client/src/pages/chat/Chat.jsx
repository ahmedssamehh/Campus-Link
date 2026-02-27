import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';

// Mock data for chats
const mockChats = [
  {
    id: 1,
    name: 'Sarah Johnson',
    lastMessage: 'Hey! Did you finish the assignment?',
    lastMessageTime: '2:30 PM',
    unreadCount: 2,
    isOnline: true,
    messages: [
      { id: 1, text: 'Hi there!', sender: 'Sarah Johnson', time: '2:15 PM', isSent: false },
      { id: 2, text: 'Hey Sarah! How are you?', sender: 'You', time: '2:16 PM', isSent: true },
      { id: 3, text: 'I\'m good! Working on the CS project', sender: 'Sarah Johnson', time: '2:17 PM', isSent: false },
      { id: 4, text: 'Hey! Did you finish the assignment?', sender: 'Sarah Johnson', time: '2:30 PM', isSent: false },
    ],
  },
  {
    id: 2,
    name: 'Computer Science Study Group',
    lastMessage: 'Meeting tomorrow at 3 PM',
    lastMessageTime: '1:45 PM',
    unreadCount: 5,
    isOnline: true,
    messages: [
      { id: 1, text: 'Who\'s available for study session?', sender: 'Mike Chen', time: '12:00 PM', isSent: false },
      { id: 2, text: 'I can join!', sender: 'You', time: '12:05 PM', isSent: true },
      { id: 3, text: 'Me too!', sender: 'Amy Lee', time: '12:10 PM', isSent: false },
      { id: 4, text: 'Great! Meeting tomorrow at 3 PM', sender: 'Mike Chen', time: '1:45 PM', isSent: false },
    ],
  },
  {
    id: 3,
    name: 'Mike Chen',
    lastMessage: 'Thanks for the notes!',
    lastMessageTime: '12:20 PM',
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: 1, text: 'Can you send me the lecture notes?', sender: 'Mike Chen', time: '11:00 AM', isSent: false },
      { id: 2, text: 'Sure! Sending them now', sender: 'You', time: '11:05 AM', isSent: true },
      { id: 3, text: 'Thanks for the notes!', sender: 'Mike Chen', time: '12:20 PM', isSent: false },
    ],
  },
  {
    id: 4,
    name: 'Emma Davis',
    lastMessage: 'See you in class!',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isOnline: true,
    messages: [
      { id: 1, text: 'Are you going to the lab tomorrow?', sender: 'Emma Davis', time: '10:30 AM', isSent: false },
      { id: 2, text: 'Yes! I\'ll be there', sender: 'You', time: '10:35 AM', isSent: true },
      { id: 3, text: 'See you in class!', sender: 'Emma Davis', time: '10:40 AM', isSent: false },
    ],
  },
  {
    id: 5,
    name: 'Mathematics Study Group',
    lastMessage: 'New practice problems posted',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: 1, text: 'Anyone struggling with calculus?', sender: 'John Smith', time: '9:00 AM', isSent: false },
      { id: 2, text: 'I need help with integrals', sender: 'You', time: '9:10 AM', isSent: true },
      { id: 3, text: 'New practice problems posted', sender: 'John Smith', time: '2:00 PM', isSent: false },
    ],
  },
];

const Chat = () => {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState(null);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Chat with your classmates and study groups</p>
      </div>

      {/* Chat Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat List */}
        <div className="w-full md:w-96 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex-shrink-0 overflow-hidden">
          <ChatList
            chats={mockChats}
            activeChat={activeChat}
            onSelectChat={handleSelectChat}
          />
        </div>

        {/* Right Section - Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow chat={activeChat} currentUser={user?.name || 'You'} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
