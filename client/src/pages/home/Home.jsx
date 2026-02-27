import React from 'react';
import { useAuth } from '../../context/AuthContext';
import WelcomeCard from '../../components/home/WelcomeCard';
import StatsCard from '../../components/home/StatsCard';
import Announcements from '../../components/home/Announcements';
import QuickActions from '../../components/home/QuickActions';

const Home = () => {
  const { user } = useAuth();

  // Mock data for stats
  const userStats = {
    studyGroups: 5,
    unreadMessages: 12,
    pendingRequests: 8, // Only for admin/owner
  };

  // Mock data for announcements
  const mockAnnouncements = [
    {
      id: 1,
      groupName: 'Computer Science Study Group',
      text: 'Reminder: Midterm exam preparation session tomorrow at 3 PM in the library.',
      time: '2 hours ago',
      isImportant: true,
    },
    {
      id: 2,
      groupName: 'Mathematics Study Group',
      text: 'New study materials uploaded for Chapter 5. Check the resources section.',
      time: '5 hours ago',
      isImportant: false,
    },
    {
      id: 3,
      groupName: 'Physics Lab Partners',
      text: 'Lab report submission deadline extended to Friday. Good luck everyone!',
      time: '1 day ago',
      isImportant: false,
    },
  ];

  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <WelcomeCard userName={user?.name || 'User'} />
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Overview</h2>
          <div className={`grid grid-cols-1 md:grid-cols-${isAdminOrOwner ? '3' : '2'} gap-6`}>
            <StatsCard
              title="Study Groups"
              value={userStats.studyGroups}
              subtitle="Active memberships"
              color="blue"
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
            />
            <StatsCard
              title="Unread Messages"
              value={userStats.unreadMessages}
              subtitle="From all chats"
              color="green"
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              }
            />
            {isAdminOrOwner && (
              <StatsCard
                title="Pending Requests"
                value={userStats.pendingRequests}
                subtitle="Awaiting approval"
                color="orange"
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
            )}
          </div>
        </div>

        {/* Admin/Owner Role Badge */}
        {isAdminOrOwner && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-md p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    {user?.role === 'owner' ? 'Owner Account' : 'Admin Account'}
                  </p>
                  <p className="text-purple-100 text-sm">
                    You have full access to manage groups and users
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Announcements Section */}
        <div className="mb-8">
          <Announcements announcements={mockAnnouncements} />
        </div>

        {/* Quick Actions Section */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default Home;
