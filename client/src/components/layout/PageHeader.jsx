import React from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useCommandPalette } from './CommandPalette';
import { BellIcon, SearchIcon } from '../ui/Icons';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

export const SearchTrigger = ({ className = '' }) => {
  const { open } = useCommandPalette();
  return (
    <button
      type="button"
      onClick={open}
      className={`group flex h-11 items-center gap-3 rounded-xl border border-gray-200/80 bg-white/90 pl-3.5 pr-2 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/90 dark:hover:border-blue-500/40 ${className}`}
    >
      <SearchIcon className="h-[18px] w-[18px] text-gray-400 group-hover:text-blue-500" />
      <span className="flex-1 truncate text-sm text-gray-400">Search groups, people…</span>
      <kbd className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
        {isMac ? '⌘ K' : 'Ctrl K'}
      </kbd>
    </button>
  );
};

export const BellButton = () => {
  const { unreadAnnouncements } = useSocket();
  return (
    <Link
      to="/announcements"
      aria-label="Announcements"
      className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200/80 bg-white/90 text-gray-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-300"
    >
      <BellIcon className="h-5 w-5" />
      {unreadAnnouncements > 0 && (
        <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-gray-800" />
      )}
    </Link>
  );
};

/**
 * Page title row: title + subtitle on the left, search + bell (+ optional actions) on the right.
 */
const PageHeader = ({ title, subtitle, actions, showSearch = true, className = '' }) => (
  <header className={`mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-center md:justify-between ${className}`}>
    <div className="min-w-0">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-[28px]">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
    <div className="flex min-w-0 items-center gap-3">
      {showSearch && <SearchTrigger className="hidden w-72 lg:flex xl:w-80" />}
      {actions}
      {showSearch && (
        <div className="hidden md:block">
          <BellButton />
        </div>
      )}
    </div>
  </header>
);

export default PageHeader;
