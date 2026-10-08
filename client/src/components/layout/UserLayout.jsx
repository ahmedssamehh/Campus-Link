import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getMediaUrl } from '../../utils/media';
import axios from '../../api/axios';
import { CommandPaletteProvider } from './CommandPalette';
import { BrandMark } from '../brand/Brand';
import {
  ChatIcon,
  HelpIcon,
  HomeIcon,
  LogoutIcon,
  MegaphoneIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from '../ui/Icons';

const useNewDiscussionCount = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const discussionLastSeenKey = `campusLinkDiscussionLastSeen:${user?._id || user?.id || 'guest'}`;

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    if (location.pathname.startsWith('/discussion')) {
      localStorage.setItem(discussionLastSeenKey, new Date().toISOString());
      setCount(0);
      return;
    }
    const storedLastSeen = localStorage.getItem(discussionLastSeenKey);
    if (!storedLastSeen) {
      localStorage.setItem(discussionLastSeenKey, new Date().toISOString());
      setCount(0);
      return;
    }
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const response = await axios.get('/discussion/questions');
        if (!isMounted || !response.data.success) return;
        const lastSeenTime = new Date(localStorage.getItem(discussionLastSeenKey) || storedLastSeen).getTime();
        const next = (response.data.questions || []).filter((q) => {
          const t = q.createdAt ? new Date(q.createdAt).getTime() : 0;
          return t > lastSeenTime;
        }).length;
        setCount(next);
      } catch {
        if (isMounted) setCount(0);
      }
    };
    fetchCount();
    const id = setInterval(fetchCount, 60000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [location.pathname, user, discussionLastSeenKey]);

  return count;
};

const useClickOutside = (ref, onOutside) => {
  const callbackRef = useRef(onOutside);
  callbackRef.current = onOutside;
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) callbackRef.current();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref]);
};

const ContentLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
    <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
  </div>
);

const UserLayout = () => {
  const newDiscussionCount = useNewDiscussionCount();
  const location = useLocation();
  // Admin sub-pages animate inside AdminLayout, so the shell treats /admin/* as one route.
  const routeKey = location.pathname.startsWith('/admin') ? '/admin' : location.pathname;

  return (
    <CommandPaletteProvider>
      <SideRail newDiscussionCount={newDiscussionCount} />
      <main className="md:pl-[88px] w-full min-w-0 max-w-[100vw] overflow-x-hidden">
        <Suspense fallback={<ContentLoader />}>
          <div key={routeKey} className="page-enter">
            <Outlet />
          </div>
        </Suspense>
      </main>
      <MobileNav newDiscussionCount={newDiscussionCount} />
    </CommandPaletteProvider>
  );
};

const Badge = ({ count, className = '' }) =>
  count > 0 ? (
    <span
      className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

const Avatar = ({ user, className = 'h-10 w-10' }) => (
  <span
    className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 ${className}`}
  >
    {user?.profilePhoto ? (
      <img src={getMediaUrl(user.profilePhoto)} alt="" className="h-full w-full object-cover" />
    ) : (
      <span className="text-sm font-semibold text-white">{user?.name?.charAt(0).toUpperCase() || '?'}</span>
    )}
  </span>
);

const RailItem = ({ to, label, Icon, badge, active }) => (
  <Link
    to={to}
    aria-current={active ? 'page' : undefined}
    className="press group flex w-[72px] flex-col items-center gap-1 py-1"
  >
    <span
      className={`relative flex h-9 w-12 items-center justify-center rounded-xl transition-colors ${
        active ? 'bg-blue-600/10 text-blue-600' : 'text-gray-500 group-hover:bg-black/[0.05] group-hover:text-gray-900'
      }`}
    >
      <Icon className="h-[21px] w-[21px]" />
      <Badge count={badge} className="absolute -right-1.5 -top-1" />
    </span>
    <span
      className={`text-[11px] leading-none ${active ? 'font-semibold text-blue-600' : 'font-medium text-gray-500 group-hover:text-gray-900'}`}
    >
      {label}
    </span>
  </Link>
);

const SideRail = ({ newDiscussionCount }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalUnreadChat, totalUnreadGroups, connected, unreadAnnouncements } = useSocket();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  useClickOutside(profileRef, () => setProfileOpen(false));

  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

  const navItems = [
    { label: 'Home', path: '/home', Icon: HomeIcon },
    { label: 'Chat', path: '/chat', Icon: ChatIcon, badge: totalUnreadChat },
    { label: 'Groups', path: '/groups', Icon: UsersIcon, badge: totalUnreadGroups },
    { label: 'Q&A', path: '/discussion', Icon: HelpIcon, badge: newDiscussionCount },
    { label: 'News', path: '/announcements', Icon: MegaphoneIcon, badge: unreadAnnouncements },
  ];

  const isActive = (path) => (path === '/home' ? location.pathname === '/home' : location.pathname.startsWith(path));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="material fixed inset-y-0 left-0 z-50 hidden w-[88px] flex-col items-center border-r border-black/[0.06] bg-white/70 py-5 backdrop-blur-2xl backdrop-saturate-150 md:flex">
      <Link to="/home" aria-label="Campus Link home" className="press brand-hover rounded-[12px] focus-visible:outline-offset-4">
        <BrandMark size={44} />
      </Link>

      <nav className="mt-6 flex flex-1 flex-col items-center gap-2" aria-label="Main">
        {navItems.map(({ label, path, Icon, badge }) => (
          <RailItem key={path} to={path} label={label} Icon={Icon} badge={badge} active={isActive(path)} />
        ))}

        {isAdminOrOwner && (
          <>
            <span className="my-2 h-px w-10 bg-black/[0.08]" aria-hidden />
            <RailItem to="/admin" label="Admin" Icon={ShieldIcon} active={isActive('/admin')} />
          </>
        )}
      </nav>

      <div className="flex flex-col items-center gap-3">
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            aria-label="Account menu"
            aria-expanded={profileOpen}
            className={`relative rounded-full ring-2 ring-offset-2 ring-offset-white transition ${
              profileOpen || location.pathname.startsWith('/profile') ? 'ring-blue-500' : 'ring-transparent hover:ring-blue-200'
            }`}
          >
            <Avatar user={user} />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white ${
                connected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
              }`}
              title={connected ? 'Connected' : 'Disconnected'}
            />
          </button>

          {profileOpen && (
            <div className="absolute bottom-0 left-full z-50 ml-3 w-60 origin-bottom-left overflow-hidden rounded-xl border border-black/[0.06] bg-white/95 py-1.5 shadow-xl backdrop-blur-xl animate-scale-in">
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                <Avatar user={user} className="h-9 w-9" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="truncate text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <UserIcon className="h-4 w-4" />
                Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogoutIcon className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

const MobileNav = ({ newDiscussionCount }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalUnreadChat, totalUnreadGroups } = useSocket();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  useClickOutside(profileMenuRef, () => setProfileMenuOpen(false));

  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

  const hiddenOnPaths = ['/groups/'];
  const isHidden = hiddenOnPaths.some((p) => location.pathname.startsWith(p) && location.pathname !== '/groups');
  if (isHidden) return null;

  const items = [
    { path: '/home', label: 'Home', Icon: HomeIcon },
    { path: '/chat', label: 'Chat', badge: totalUnreadChat, Icon: ChatIcon },
    { path: '/groups', label: 'Groups', badge: totalUnreadGroups, Icon: UsersIcon },
    { path: '/discussion', label: 'Q&A', badge: newDiscussionCount, Icon: HelpIcon },
    ...(isAdminOrOwner ? [{ path: '/admin', label: 'Admin', Icon: ShieldIcon }] : []),
  ];

  const profileActive = location.pathname.startsWith('/profile');

  const handleMobileLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const menuItemCls =
    'flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50';

  return (
    <nav className="material safe-area-bottom fixed bottom-0 left-0 right-0 z-40 overflow-visible border-t border-black/[0.06] bg-white/75 backdrop-blur-2xl backdrop-saturate-150 md:hidden">
      <div className="flex min-h-[60px] items-center justify-around overflow-visible px-1 py-1.5">
        {items.map(({ path, label, badge, Icon }) => {
          const active = location.pathname.startsWith(path);
          return (
            <Link key={path} to={path} className="relative flex min-w-0 flex-1 flex-col items-center justify-center py-0.5">
              <span
                className={`relative flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <Icon className="h-[21px] w-[21px]" />
                <Badge count={badge} className="absolute -top-1 right-0.5" />
              </span>
              <span
                className={`mt-0.5 max-w-full truncate px-0.5 text-[10px] ${
                  active ? 'font-semibold text-blue-600' : 'font-medium text-gray-500'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
        <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center py-0.5" ref={profileMenuRef}>
          {profileMenuOpen && (
            <div
              className="absolute bottom-full right-1 z-50 mb-3 w-52 origin-bottom-right overflow-hidden rounded-xl border border-black/[0.06] bg-white/95 py-1.5 shadow-xl backdrop-blur-xl animate-scale-in"
              role="menu"
            >
              <div className="border-b border-gray-100 px-4 py-2.5">
                <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
              <Link to="/profile" role="menuitem" onClick={() => setProfileMenuOpen(false)} className={menuItemCls}>
                <UserIcon className="h-4 w-4" />
                Profile
              </Link>
              <Link to="/announcements" role="menuitem" onClick={() => setProfileMenuOpen(false)} className={menuItemCls}>
                <MegaphoneIcon className="h-4 w-4" />
                Announcements
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleMobileLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogoutIcon className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setProfileMenuOpen((o) => !o)}
            className="flex w-full min-w-0 flex-col items-center justify-center"
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            <span
              className={`rounded-full ring-2 ring-offset-1 ring-offset-white ${
                profileActive || profileMenuOpen ? 'ring-blue-500' : 'ring-transparent'
              }`}
            >
              <Avatar user={user} className="h-8 w-8" />
            </span>
            <span className="mt-0.5 text-[10px] font-medium text-gray-500">You</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default UserLayout;
