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
      className={`flex h-9 items-center gap-2 rounded-lg bg-black/[0.05] pl-2.5 pr-1.5 text-left transition-colors hover:bg-black/[0.08] ${className}`}
    >
      <SearchIcon className="h-4 w-4 text-gray-500" />
      <span className="flex-1 truncate text-sm text-gray-500">Search</span>
      <kbd className="rounded px-1.5 font-sans text-xs text-gray-400">
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
      className="press relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-black/[0.05]"
    >
      <BellIcon className="h-5 w-5" />
      {unreadAnnouncements > 0 && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-gray-50" />
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
      <h1 className="text-[28px] font-bold text-gray-900 sm:text-[32px]">{title}</h1>
      {subtitle && <p className="mt-0.5 text-[15px] text-gray-500">{subtitle}</p>}
    </div>
    <div className="flex min-w-0 items-center gap-2">
      {showSearch && <SearchTrigger className="hidden w-56 lg:flex xl:w-64" />}
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
