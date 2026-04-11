import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getMediaUrl } from '../../utils/media';
import axios from '../../api/axios';

const UserLayout = () => {
  return (
    <>
      <TopNavbar />
      <div className="md:pt-16 w-full min-w-0 max-w-[100vw] overflow-x-hidden">
        <Outlet />
      </div>
      <MobileNav />
    </>
  );
};

const TopNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalUnreadChat, totalUnreadGroups, connected, unreadAnnouncements } = useSocket();
  const [newDiscussionCount, setNewDiscussionCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';
  const discussionLastSeenKey = `campusLinkDiscussionLastSeen:${user?._id || user?.id || 'guest'}`;

  useEffect(() => {
    if (!user) { setNewDiscussionCount(0); return; }
    if (location.pathname.startsWith('/discussion')) {
      localStorage.setItem(discussionLastSeenKey, new Date().toISOString());
      setNewDiscussionCount(0);
      return;
    }
    const storedLastSeen = localStorage.getItem(discussionLastSeenKey);
    if (!storedLastSeen) {
      localStorage.setItem(discussionLastSeenKey, new Date().toISOString());
      setNewDiscussionCount(0);
      return;
    }
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const response = await axios.get('/discussion/questions');
        if (!isMounted || !response.data.success) return;
        const lastSeenTime = new Date(localStorage.getItem(discussionLastSeenKey) || storedLastSeen).getTime();
        const count = (response.data.questions || []).filter((q) => {
          const t = q.createdAt ? new Date(q.createdAt).getTime() : 0;
          return t > lastSeenTime;
        }).length;
        setNewDiscussionCount(count);
      } catch { if (isMounted) setNewDiscussionCount(0); }
    };
    fetchCount();
    const id = setInterval(fetchCount, 60000);
    return () => { isMounted = false; clearInterval(id); };
  }, [location.pathname, user, discussionLastSeenKey]);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { name: 'Home', path: '/home' },
    { name: 'Chat', path: '/chat', badge: totalUnreadChat },
    { name: 'Groups', path: '/groups', badge: totalUnreadGroups },
    { name: 'Discussion', path: '/discussion', badge: newDiscussionCount },
    { name: 'News', path: '/announcements', badge: unreadAnnouncements },
    ...(isAdminOrOwner ? [{ name: 'Admin', path: '/admin' }] : []),
  ];

  const isActive = (path) => {
    if (path === '/home') return location.pathname === '/home';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-2.5 flex-shrink-0">
            <img src="/logo.png" alt="Campus Link" className="w-9 h-9 rounded-lg object-cover border border-gray-200 dark:border-gray-600" />
            <span className="text-lg font-bold text-gray-900 dark:text-white hidden lg:inline">Campus Link</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.name}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right side: connection + profile */}
          <div className="flex items-center space-x-3" ref={profileRef}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} title={connected ? 'Connected' : 'Disconnected'} />

            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {user?.profilePhoto ? (
                <img src={getMediaUrl(user.profilePhoto)} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <svg className={`w-4 h-4 text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile dropdown */}
            {profileOpen && (
              <div className="absolute right-4 top-14 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalUnreadChat, totalUnreadGroups } = useSocket();

  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

  const hiddenOnPaths = ['/groups/'];
  const isHidden = hiddenOnPaths.some((p) => location.pathname.startsWith(p) && location.pathname !== '/groups');
  if (isHidden) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const items = [
    { path: '/home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/chat', label: 'Chat', badge: totalUnreadChat, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { path: '/groups', label: 'Groups', badge: totalUnreadGroups, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    ...(isAdminOrOwner ? [{ path: '/admin', label: 'Admin', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }] : []),
    { path: '/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  const logoutIcon = 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom">
      <div className="flex justify-around items-center min-h-14 py-1">
        {items.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center flex-1 min-w-0 py-1 relative">
              <div className="relative">
                <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] sm:text-[10px] mt-0.5 truncate max-w-full px-0.5 ${active ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 min-w-0 py-1 text-red-600 dark:text-red-400"
        >
          <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={logoutIcon} />
          </svg>
          <span className="text-[9px] sm:text-[10px] mt-0.5 font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default UserLayout;
