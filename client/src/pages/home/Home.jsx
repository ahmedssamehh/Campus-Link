import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from '../../api/axios';
import { BellButton, SearchTrigger } from '../../components/layout/PageHeader';
import { BrandLockup, Wordmark } from '../../components/brand/Brand';
import AlertBanner from '../../components/ui/AlertBanner';
import CatchUp from '../../components/home/CatchUp';
import OnCampus from '../../components/home/OnCampus';
import GroupsWidget from '../../components/home/GroupsWidget';
import DiscussionsWidget from '../../components/home/DiscussionsWidget';
import AnnouncementsWidget from '../../components/home/AnnouncementsWidget';
import TodayHero from '../../components/home/TodayHero';
import AdminTools from '../../components/home/AdminTools';
import { distinctGroupTones } from '../../utils/groups';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const SummaryLink = ({ to, children }) => (
  <Link
    to={to}
    className="font-semibold text-white underline decoration-white/40 decoration-1 underline-offset-[5px] transition-colors hover:decoration-white"
  >
    {children}
  </Link>
);

/** One plain sentence that tells the user what's waiting — each part links to where it lives. */
const Summary = ({ unread, announcements, requests }) => {
  const parts = [];
  if (unread > 0) parts.push(<SummaryLink key="m" to="/chat">{plural(unread, 'unread message')}</SummaryLink>);
  if (announcements > 0) parts.push(<SummaryLink key="a" to="/announcements">{plural(announcements, 'new announcement')}</SummaryLink>);
  if (requests > 0) parts.push(<SummaryLink key="r" to="/admin/requests">{plural(requests, 'request')} to review</SummaryLink>);

  if (parts.length === 0) return <>Nothing needs your attention right now.</>;

  const joined = parts.flatMap((p, i) => {
    if (i === 0) return [p];
    return [i === parts.length - 1 ? ' and ' : ', ', p];
  });
  return <>You have {joined}.</>;
};

const Home = () => {
  const { user } = useAuth();
  const { unreadAnnouncements, onNewAnnouncement, totalUnread, unreadMessages, onlineUsers } = useSocket();
  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';
  const userId = user?._id || user?.id;

  const [allGroups, setAllGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [groupsRes, contactsRes] = await Promise.all([
        axios.get('/groups'),
        axios.get('/chats/available-users').catch(() => null),
      ]);
      const groups = groupsRes.data.success ? groupsRes.data.groups : [];
      setAllGroups(groups);
      setMyGroups(groups.filter((g) => g.members?.some((m) => (m._id || m) === userId)));
      setContacts(contactsRes?.data?.success ? contactsRes.data.users || [] : []);

      if (isAdminOrOwner) {
        const reqRes = await axios.get('/groups/requests/all');
        if (reqRes.data.success) {
          setPendingRequests((reqRes.data.requests || []).filter((r) => r.status === 'pending').length);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'We could not load your overview. Try again shortly.';
      setError(typeof msg === 'string' ? msg : 'Something went wrong loading your overview.');
    } finally {
      setLoading(false);
    }
  }, [userId, isAdminOrOwner]);

  useEffect(() => {
    if (user) fetchOverview();
  }, [user, fetchOverview]);

  useEffect(() => {
    if (!user) return undefined;
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

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    setAnnouncementsLoading(true);
    axios
      .get('/announcements/latest')
      .then((res) => alive && res.data.success && setAnnouncements(res.data.announcements || []))
      .catch(() => {})
      .finally(() => alive && setAnnouncementsLoading(false));
    return () => {
      alive = false;
    };
  }, [user]);

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

  // Everyone the user knows, keyed by id: group members + chat contacts.
  const peopleById = useMemo(() => {
    const map = new Map();
    myGroups.forEach((g) =>
      (g.members || []).forEach((m) => {
        if (m && typeof m === 'object' && m._id) map.set(String(m._id), m);
      })
    );
    contacts.forEach((c) => c?._id && map.set(String(c._id), c));
    map.delete(String(userId));
    return map;
  }, [myGroups, contacts, userId]);

  const onlinePeople = useMemo(
    () => [...peopleById.values()].filter((p) => onlineUsers?.has(p._id) || onlineUsers?.has(String(p._id))),
    [peopleById, onlineUsers]
  );

  const unreadPeople = useMemo(
    () =>
      Object.entries(unreadMessages?.private || {})
        .filter(([, count]) => count > 0)
        .map(([id, count]) => ({ user: peopleById.get(String(id)), count }))
        .filter((x) => x.user),
    [unreadMessages, peopleById]
  );

  const unreadGroups = useMemo(
    () =>
      myGroups
        .map((g) => ({ group: { ...g, _id: g._id || g.id }, count: unreadMessages?.groups?.[g._id || g.id] || 0 }))
        .filter((x) => x.count > 0),
    [myGroups, unreadMessages]
  );

  // Same list and order as the Groups page, so each group keeps one colour everywhere.
  const groupTones = useMemo(() => distinctGroupTones(allGroups), [allGroups]);
  const latestUnreadAnnouncement = announcements.find((a) => !a.isRead);
  const firstName = (user?.name || '').split(' ')[0];
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gray-50 pb-28 pt-6 md:pb-12 md:pt-8">
      <div className="mx-auto min-w-0 max-w-6xl px-5 sm:px-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <BrandLockup size="md" className="md:hidden" />
          <Wordmark size="lg" className="hidden md:inline" />
          <div className="hidden items-center gap-2 md:flex">
            <SearchTrigger className="w-56 xl:w-64" />
            <BellButton />
          </div>
        </div>

        <div className="mb-4 lg:mb-5">
          <TodayHero
            firstName={firstName}
            date={today}
            summary={
              loading ? ' ' : (
                <Summary unread={totalUnread || 0} announcements={unreadAnnouncements || 0} requests={pendingRequests} />
              )
            }
            unread={totalUnread || 0}
            announcements={unreadAnnouncements || 0}
            requests={isAdminOrOwner ? pendingRequests : undefined}
            groupCount={myGroups.length}
          />
        </div>

        {error && (
          <div className="mb-5">
            <AlertBanner variant="error">{error}</AlertBanner>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          {isAdminOrOwner && (
            <AdminTools index={1} className="lg:col-span-12" pendingRequests={pendingRequests} role={user?.role} />
          )}

          <CatchUp
            index={2}
            className="lg:col-span-7"
            loading={loading}
            people={unreadPeople}
            groups={unreadGroups}
            tones={groupTones}
            announcements={{ count: unreadAnnouncements || 0, latestTitle: latestUnreadAnnouncement?.title }}
            pendingRequests={pendingRequests}
          />
          <OnCampus index={3} className="lg:col-span-5" loading={loading} people={onlinePeople} />

          <GroupsWidget
            index={4}
            className="lg:col-span-12"
            loading={loading}
            groups={myGroups}
            unreadByGroup={unreadMessages?.groups}
            onlineUsers={onlineUsers}
            userId={userId}
            tones={groupTones}
          />

          <DiscussionsWidget index={5} className="lg:col-span-7" loading={questionsLoading} questions={questions} />
          <AnnouncementsWidget
            index={6}
            className="lg:col-span-5"
            stacked
            loading={announcementsLoading}
            announcements={announcements}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
