import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSocket } from '../../context/SocketContext';

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Sidebar: hidden on mobile, visible on md+ */}
      <div className="hidden md:block">
        <Sidebar
          isOpen={sidebarOpen}
          onMouseEnter={() => setSidebarOpen(true)}
          onMouseLeave={() => setSidebarOpen(false)}
        />
      </div>

      {/* Overlay when sidebar is expanded on desktop */}
      {sidebarOpen && (
        <div className="hidden md:block fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40 transition-all duration-300" />
      )}

      {/* Main content: no left margin on mobile, ml-20 on md+ */}
      <div
        className={`
          md:ml-20
          ${sidebarOpen ? 'md:blur-sm md:pointer-events-none' : ''}
          transition-all duration-300
        `}
      >
        <Outlet />
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </>
  );
};

const MobileNav = () => {
  const location = useLocation();
  const { totalUnreadChat, totalUnreadGroups, unreadAnnouncements } = useSocket();

  const items = [
    { path: '/home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/chat', label: 'Chat', badge: totalUnreadChat, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { path: '/groups', label: 'Groups', badge: totalUnreadGroups, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { path: '/announcements', label: 'News', badge: unreadAnnouncements, icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { path: '/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-14">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center flex-1 py-1 relative">
              <div className="relative">
                <svg className={`h-6 w-6 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default UserLayout;
