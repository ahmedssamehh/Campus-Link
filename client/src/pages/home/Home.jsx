import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from '../../api/axios';
import WelcomeCard from '../../components/home/WelcomeCard';
import StatsCard from '../../components/home/StatsCard';
import Announcements from '../../components/home/Announcements';
import QuickActions from '../../components/home/QuickActions';

const Home = () => {
  const { user } = useAuth();
  const { unreadAnnouncements, onNewAnnouncement } = useSocket();
  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

  const [stats, setStats] = useState({
    studyGroups: 0,
    unreadMessages: 0,
    pendingRequests: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const userId = user?._id || user?.id;

      // Fetch groups to count user's memberships
      const groupsRes = await axios.get('/groups');
      const allGroups = groupsRes.data.success ? groupsRes.data.groups : [];
      const joinedCount = allGroups.filter(g =>
        g.members?.some(m => (m._id || m) === userId)
      ).length;

      let pendingCount = 0;
      if (isAdminOrOwner) {
        const reqRes = await axios.get('/groups/requests/all');
        if (reqRes.data.success) {
          pendingCount = (reqRes.data.requests || []).filter(r => r.status === 'pending').length;
        }
      }

      setStats({
        studyGroups: joinedCount,
        unreadMessages: 0,
        pendingRequests: pendingCount,
      });
    } catch (err) {
    } finally {
      setStatsLoading(false);
    }
  }, [user, isAdminOrOwner]);

  useEffect(() => {
    if (user) fetchStats();
  }, [user, fetchStats]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setAnnouncementsLoading(true);
      const response = await axios.get('/announcements/latest');
      if (response.data.success) {
        setAnnouncements(response.data.announcements);
      }
    } catch (err) {
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchAnnouncements();
  }, [user, fetchAnnouncements]);

  // Realtime: prepend new announcements when received via socket
  useEffect(() => {
    const unsub = onNewAnnouncement((newAnn) => {
      setAnnouncements(prev => {
        if (prev.some(a => a._id === newAnn._id)) return prev;
        // Keep only 5 latest (same as /latest endpoint)
        return [{ ...newAnn, isRead: false }, ...prev].slice(0, 5);
      });
    });
    return unsub;
  }, [onNewAnnouncement]);

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
              value={statsLoading ? '…' : stats.studyGroups}
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
              value={statsLoading ? '…' : stats.unreadMessages}
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
                value={statsLoading ? '…' : stats.pendingRequests}
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

        {/* Unread Announcements Badge */}
        {unreadAnnouncements > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg shadow-md p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    {unreadAnnouncements} New Announcement{unreadAnnouncements !== 1 ? 's' : ''}
                  </p>
                  <p className="text-orange-100 text-sm">
                    You have unread announcements from your groups
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
          <Announcements 
            announcements={announcements} 
            loading={announcementsLoading}
            unreadCount={unreadAnnouncements}
          />
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
