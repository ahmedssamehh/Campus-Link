import React from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon } from '../ui/Icons';

const tileTones = [
  'from-blue-600 to-blue-800',
  'from-slate-700 to-blue-900',
  'from-sky-400 to-blue-500',
  'from-blue-500 to-indigo-700',
];

export const groupInitials = (name = '') => {
  const words = name.split(/[\s\-_·.,:&/]+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const CardShell = ({ title, action, children }) => (
  <section className="flex min-w-0 flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-gray-700/60 dark:bg-gray-800 sm:p-6 animate-fade-up">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

export { CardShell };

const YourGroups = ({ groups, loading, unreadByGroup = {}, onlineUsers }) => (
  <CardShell
    title="Your groups"
    action={
      <Link to="/groups" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
        View all
      </Link>
    }
  >
    {loading ? (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 py-2">
            <div className="h-11 w-11 rounded-xl bg-gray-100 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/5 rounded bg-gray-100 dark:bg-gray-700" />
              <div className="h-3 w-1/4 rounded bg-gray-100 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    ) : groups.length === 0 ? (
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
          <UsersIcon className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">No groups yet</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Join a study group to start collaborating.</p>
        <Link
          to="/groups"
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-blue-700"
        >
          Browse groups
        </Link>
      </div>
    ) : (
      <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
        {groups.slice(0, 4).map((g, idx) => {
          const id = g._id || g.id;
          const unread = unreadByGroup[id] || 0;
          const live = (g.members || []).some((m) => onlineUsers?.has?.(m._id || m));
          return (
            <li key={id}>
              <Link
                to={`/groups/${id}`}
                className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-700/40"
              >
                <span
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
                    tileTones[idx % tileTones.length]
                  } text-xs font-bold text-white shadow-sm`}
                >
                  {groupInitials(g.subject || g.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {g.subject && g.subject !== g.name ? `${g.subject} · ${g.name}` : g.name}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {g.members?.length || 0} members
                  </span>
                </span>
                {unread > 0 ? (
                  <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white shadow-glow">
                    {unread > 99 ? '99+' : unread}
                  </span>
                ) : live ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Live
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    )}
  </CardShell>
);

export default YourGroups;
