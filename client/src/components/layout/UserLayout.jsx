import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { getMediaUrl } from '../../utils/media';
import axios from '../../api/axios';
import { CommandPaletteProvider } from './CommandPalette';
import {
  CapIcon,
  ChatIcon,
  HelpIcon,
  HomeIcon,
  LogoutIcon,
  MegaphoneIcon,
  MoonIcon,
  ShieldIcon,
  SunIcon,
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

const UserLayout = () => {
  const newDiscussionCount = useNewDiscussionCount();
  return (
    <CommandPaletteProvider>
      <SideRail newDiscussionCount={newDiscussionCount} />
      <div className="md:pl-[88px] w-full min-w-0 max-w-[100vw] overflow-x-hidden">
        <Outlet />
      </div>
      <MobileNav newDiscussionCount={newDiscussionCount} />
    </CommandPaletteProvider>
  );
};

const Badge = ({ count, className = '' }) =>
  count > 0 ? (
    <span
      className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-gray-900 ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

const Avatar = ({ user, className = 'h-10 w-10' }) => (
  <span
    className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 ${className}`}
  >
    {user?.profilePhoto ? (
      <img src={getMediaUrl(user.profilePhoto)} alt="" className="h-full w-full object-cover" />
    ) : (
      <span className="text-sm font-semibold text-white">{user?.name?.charAt(0).toUpperCase() || '?'}</span>
    )}
  </span>
);

const Tooltip = ({ children }) => (
  <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
    {children}
  </span>
);

const SideRail = ({ newDiscussionCount }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalUnreadChat, totalUnreadGroups, connected, unreadAnnouncements } = useSocket();
  const { isDark, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  useClickOutside(profileRef, () => setProfileOpen(false));

  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

  const navItems = [
    { name: 'Home', path: '/home', Icon: HomeIcon },
    { name: 'Chat', path: '/chat', Icon: ChatIcon, badge: totalUnreadChat },
    { name: 'Study groups', path: '/groups', Icon: UsersIcon, badge: totalUnreadGroups },
    { name: 'Q&A board', path: '/discussion', Icon: HelpIcon, badge: newDiscussionCount },
    { name: 'Announcements', path: '/announcements', Icon: MegaphoneIcon, badge: unreadAnnouncements },
    ...(isAdminOrOwner ? [{ name: 'Admin panel', path: '/admin', Icon: ShieldIcon }] : []),
  ];

  const isActive = (path) => (path === '/home' ? location.pathname === '/home' : location.pathname.startsWith(path));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[88px] flex-col items-center border-r border-gray-200/70 bg-white/85 py-5 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/85 md:flex">
      <Link
        to="/home"
        aria-label="Campus Link home"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-glow transition hover:scale-105"
      >
        <CapIcon className="h-6 w-6" />
      </Link>

      <nav className="mt-8 flex flex-1 flex-col items-center gap-2">
        {navItems.map(({ name, path, Icon, badge }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              aria-label={name}
              className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
                active
                  ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/20'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="h-[22px] w-[22px]" />
              <Badge count={badge} className="absolute -right-1 -top-1" />
              <Tooltip>{name}</Tooltip>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="group relative flex h-11 w-11 items-center justify-center rounded-2xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          <Tooltip>{isDark ? 'Light mode' : 'Dark mode'}</Tooltip>
        </button>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            aria-label="Account menu"
            aria-expanded={profileOpen}
            className={`relative rounded-full ring-2 ring-offset-2 ring-offset-white transition dark:ring-offset-gray-900 ${
              profileOpen || location.pathname.startsWith('/profile') ? 'ring-blue-500' : 'ring-transparent hover:ring-blue-200'
            }`}
          >
            <Avatar user={user} />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-gray-900 ${
                connected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
              }`}
              title={connected ? 'Connected' : 'Disconnected'}
            />
          </button>

          {profileOpen && (
            <div className="absolute bottom-0 left-full z-50 ml-4 w-60 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl animate-scale-in dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                <Avatar user={user} className="h-9 w-9" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
              >
                <UserIcon className="h-4 w-4" />
                Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
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
  const { isDark, toggleTheme } = useTheme();
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
    'flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700';

  return (
    <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 overflow-visible border-t border-gray-200/70 bg-white/90 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90 md:hidden">
      <div className="flex min-h-[60px] items-center justify-around overflow-visible px-1 py-1.5">
        {items.map(({ path, label, badge, Icon }) => {
          const active = location.pathname.startsWith(path);
          return (
            <Link key={path} to={path} className="relative flex min-w-0 flex-1 flex-col items-center justify-center py-0.5">
              <span
                className={`relative flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                  active ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <Icon className="h-[21px] w-[21px]" />
                <Badge count={badge} className="absolute -top-1 right-0.5" />
              </span>
              <span
                className={`mt-0.5 max-w-full truncate px-0.5 text-[10px] ${
                  active ? 'font-semibold text-blue-600 dark:text-blue-300' : 'font-medium text-gray-500 dark:text-gray-400'
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
              className="absolute bottom-full right-1 z-50 mb-3 w-52 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl animate-scale-in dark:border-gray-700 dark:bg-gray-800"
              role="menu"
            >
              <div className="border-b border-gray-100 px-4 py-2.5 dark:border-gray-700">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <Link to="/profile" role="menuitem" onClick={() => setProfileMenuOpen(false)} className={menuItemCls}>
                <UserIcon className="h-4 w-4" />
                Profile
              </Link>
              <Link to="/announcements" role="menuitem" onClick={() => setProfileMenuOpen(false)} className={menuItemCls}>
                <MegaphoneIcon className="h-4 w-4" />
                Announcements
              </Link>
              <button type="button" role="menuitem" onClick={toggleTheme} className={menuItemCls}>
                {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                {isDark ? 'Light mode' : 'Dark mode'}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleMobileLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
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
              className={`rounded-full ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-900 ${
                profileActive || profileMenuOpen ? 'ring-blue-500' : 'ring-transparent'
              }`}
            >
              <Avatar user={user} className="h-8 w-8" />
            </span>
            <span className="mt-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">You</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default UserLayout;
