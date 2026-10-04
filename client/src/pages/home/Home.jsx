import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from '../../api/axios';
import WelcomeCard from '../../components/home/WelcomeCard';
import StatsCard from '../../components/home/StatsCard';
import Announcements from '../../components/home/Announcements';
import YourGroups from '../../components/home/YourGroups';
import TrendingDiscussions from '../../components/home/TrendingDiscussions';
import PageHeader from '../../components/layout/PageHeader';
import AlertBanner from '../../components/ui/AlertBanner';
import { SkeletonStatsCard } from '../../components/ui/Skeleton';
import { ChatIcon, ClockIcon, MegaphoneIcon, UsersIcon } from '../../components/ui/Icons';

const todayLabel = () =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

const Home = () => {
  const { user } = useAuth();
  const { unreadAnnouncements, onNewAnnouncement, totalUnread, unreadMessages, onlineUsers } = useSocket();
  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';
  const userId = user?._id || user?.id;

  const [myGroups, setMyGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError('');

      const groupsRes = await axios.get('/groups');
      const allGroups = groupsRes.data.success ? groupsRes.data.groups : [];
      setMyGroups(allGroups.filter((g) => g.members?.some((m) => (m._id || m) === userId)));

      if (isAdminOrOwner) {
        const reqRes = await axios.get('/groups/requests/all');
        if (reqRes.data.success) {
          setPendingRequests((reqRes.data.requests || []).filter((r) => r.status === 'pending').length);
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'We could not load your overview. Pull to refresh or try again shortly.';
      setStatsError(typeof msg === 'string' ? msg : 'Something went wrong loading stats.');
    } finally {
      setStatsLoading(false);
    }
  }, [userId, isAdminOrOwner]);

  useEffect(() => {
    if (user) fetchStats();
  }, [user, fetchStats]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setQuestionsLoading(true);
    axios
      .get('/discussion/questions')
      .then((res) => {
        if (!alive || !res.data.success) return;
        const ranked = [...(res.data.questions || [])].sort(
          (a, b) => (b.votes || 0) - (a.votes || 0) || (b.answersCount || 0) - (a.answersCount || 0)
        );
        setQuestions(ranked);
      })
      .catch(() => {})
      .finally(() => alive && setQuestionsLoading(false));
    return () => {
      alive = false;
    };
  }, [user]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setAnnouncementsLoading(true);
      setAnnouncementsError('');
      const response = await axios.get('/announcements/latest');
      if (response.data.success) {
        setAnnouncements(response.data.announcements);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Announcements could not be loaded. You can still browse from the menu.';
      setAnnouncementsError(typeof msg === 'string' ? msg : 'Failed to load announcements.');
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
      setAnnouncements((prev) => {
        if (prev.some((a) => a._id === newAnn._id)) return prev;
        // Keep only 5 latest (same as /latest endpoint)
        return [{ ...newAnn, isRead: false }, ...prev].slice(0, 5);
      });
    });
    return unsub;
  }, [onNewAnnouncement]);

  // Classmates from my groups who are online right now (excluding me)
  const onlineClassmates = useMemo(() => {
    const seen = new Map();
    myGroups.forEach((g) =>
      (g.members || []).forEach((m) => {
        const id = m?._id || m;
        if (id && id !== userId && typeof m === 'object' && onlineUsers?.has(id) && !seen.has(id)) seen.set(id, m);
      })
    );
    return [...seen.values()];
  }, [myGroups, onlineUsers, userId]);

  const activeGroups = useMemo(
    () =>
      myGroups.filter((g) => (g.members || []).some((m) => (m._id || m) !== userId && onlineUsers?.has(m._id || m)))
        .length,
    [myGroups, onlineUsers, userId]
  );

  const unreadToday = totalUnread || 0;

  return (
    <div className="bg-grid-soft min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gray-50 pb-24 pt-6 transition-colors duration-200 dark:bg-gray-900 md:pb-10 md:pt-8">
      <div className="mx-auto min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeader title="Home" subtitle={todayLabel()} />

        <WelcomeCard
          userName={user?.name || 'User'}
          unreadMessages={unreadToday}
          unreadAnnouncements={unreadAnnouncements}
          pendingRequests={pendingRequests}
          onlineClassmates={onlineClassmates}
        />

        {statsError && (
          <div className="mt-6">
            <AlertBanner variant="error">{statsError}</AlertBanner>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {statsLoading ? (
            <>
              <SkeletonStatsCard />
              <SkeletonStatsCard />
              <SkeletonStatsCard />
            </>
          ) : (
            <>
              <StatsCard
                title="Unread messages"
                value={unreadToday}
                tone="blue"
                to="/chat"
                pill={unreadToday > 0 ? 'New' : 'All read'}
                icon={<ChatIcon className="h-[22px] w-[22px]" />}
              />
              <StatsCard
                title="Study groups"
                value={myGroups.length}
                tone="navy"
                to="/groups"
                delay={60}
                pill={activeGroups > 0 ? `${activeGroups} active now` : undefined}
                icon={<UsersIcon className="h-[22px] w-[22px]" />}
              />
              {isAdminOrOwner ? (
                <StatsCard
                  title="Pending requests"
                  value={pendingRequests}
                  tone="sky"
                  to="/admin/requests"
                  delay={120}
                  pill={pendingRequests > 0 ? 'To review' : undefined}
                  icon={<ClockIcon className="h-[22px] w-[22px]" />}
                />
              ) : (
                <StatsCard
                  title="New announcements"
                  value={unreadAnnouncements || 0}
                  tone="sky"
                  to="/announcements"
                  delay={120}
                  pill={unreadAnnouncements > 0 ? 'Read now' : undefined}
                  icon={<MegaphoneIcon className="h-[22px] w-[22px]" />}
                />
              )}
            </>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <YourGroups
            groups={myGroups}
            loading={statsLoading}
            unreadByGroup={unreadMessages?.groups}
            onlineUsers={onlineUsers}
          />
          <TrendingDiscussions questions={questions} loading={questionsLoading} />
        </div>

        <div className="mt-6">
          {announcementsError && (
            <div className="mb-4">
              <AlertBanner variant="error">{announcementsError}</AlertBanner>
            </div>
          )}
          <Announcements
            announcements={announcements}
            loading={announcementsLoading}
            unreadCount={unreadAnnouncements}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
