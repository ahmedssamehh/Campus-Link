import React from 'react';
import { Link } from 'react-router-dom';
import { SkeletonAnnouncementCard } from '../ui/Skeleton';
import { CardShell } from './YourGroups';
import { MegaphoneIcon } from '../ui/Icons';

const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const Announcements = ({ announcements, loading, unreadCount }) => (
  <CardShell
    title={
      <span className="flex items-center gap-2">
        Latest announcements
        {unreadCount > 0 && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
            {unreadCount} new
          </span>
        )}
      </span>
    }
    action={
      <Link to="/announcements" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
        See all
      </Link>
    }
  >
    {loading ? (
      <div className="space-y-3" aria-busy="true" aria-label="Loading announcements">
        <SkeletonAnnouncementCard />
        <SkeletonAnnouncementCard />
      </div>
    ) : !announcements || announcements.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
          <MegaphoneIcon className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">No announcements yet</p>
        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          When your groups post updates, they will appear here.
        </p>
      </div>
    ) : (
      <ul className="grid gap-3 sm:grid-cols-2">
        {announcements.map((a) => (
          <li key={a._id}>
            <Link
              to="/announcements"
              className={`flex h-full items-start gap-3 rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                a.isRead
                  ? 'border-gray-100 bg-white dark:border-gray-700/60 dark:bg-gray-800'
                  : 'border-blue-100 bg-blue-50/60 dark:border-blue-500/20 dark:bg-blue-500/5'
              }`}
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-glow">
                <MegaphoneIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{a.title}</span>
                  <span className="flex-shrink-0 text-xs text-gray-400">{getRelativeTime(a.createdAt)}</span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-sm text-gray-500 dark:text-gray-400">{a.content}</span>
                {a.group?.name && (
                  <span className="mt-2 inline-block text-xs font-medium text-blue-600 dark:text-blue-400">{a.group.name}</span>
                )}
              </span>
              {!a.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />}
            </Link>
          </li>
        ))}
      </ul>
    )}
  </CardShell>
);

export default Announcements;
