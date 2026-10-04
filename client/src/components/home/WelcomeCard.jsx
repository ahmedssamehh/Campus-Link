import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, ChatIcon, SparkleIcon } from '../ui/Icons';
import { getMediaUrl } from '../../utils/media';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getTermLabel = () => {
  const now = new Date();
  const m = now.getMonth();
  const term = m >= 8 ? 'Fall semester' : m >= 5 ? 'Summer term' : 'Spring semester';
  return `${term} · ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const buildSummary = ({ unreadMessages, unreadAnnouncements, pendingRequests }) => {
  const parts = [];
  if (unreadMessages > 0) parts.push(plural(unreadMessages, 'new message'));
  if (unreadAnnouncements > 0) parts.push(plural(unreadAnnouncements, 'announcement'));
  if (pendingRequests > 0) parts.push(plural(pendingRequests, 'join request'));
  if (parts.length === 0) return "You're all caught up. Here's what's happening on campus today.";
  const single = parts.length === 1 && /^1 /.test(parts[0]);
  const last = parts.pop();
  const joined = parts.length ? `${parts.join(', ')} and ${last}` : last;
  return `${joined} ${single ? 'is' : 'are'} waiting.`;
};

const WelcomeCard = ({ userName, unreadMessages = 0, unreadAnnouncements = 0, pendingRequests = 0, onlineClassmates = [] }) => {
  const firstName = (userName || 'there').split(' ')[0];
  const shown = onlineClassmates.slice(0, 4);
  const extra = onlineClassmates.length - shown.length;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 p-6 text-white shadow-glow sm:p-8 animate-fade-up">
      {/* Decorative layers */}
      <div className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-40 right-40 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.9) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          maskImage: 'linear-gradient(to left, black, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to left, black, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <SparkleIcon className="h-3.5 w-3.5" />
            {getTermLabel()}
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-tight">
            {getGreeting()}, {firstName} <span aria-hidden="true">👋</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-blue-100 sm:text-[15px]">
            {buildSummary({ unreadMessages, unreadAnnouncements, pendingRequests })}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 sm:px-4 shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <ChatIcon className="h-4 w-4" />
              Open chat
            </Link>
            <Link
              to="/groups"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3.5 py-2.5 sm:px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Browse groups
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3 self-start rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md sm:p-4 lg:block lg:self-center">
          <div className="flex -space-x-2">
            {shown.length === 0 && (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold ring-2 ring-blue-600">
                –
              </span>
            )}
            {shown.map((m) =>
              m.profilePhoto ? (
                <img
                  key={m._id}
                  src={getMediaUrl(m.profilePhoto)}
                  alt={m.name}
                  title={m.name}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-600"
                />
              ) : (
                <span
                  key={m._id}
                  title={m.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-700 text-xs font-bold ring-2 ring-blue-600"
                >
                  {m.name?.charAt(0).toUpperCase()}
                </span>
              )
            )}
            {extra > 0 && (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold ring-2 ring-blue-600">
                +{extra}
              </span>
            )}
          </div>
          <p className="flex items-center gap-2 text-sm font-semibold lg:mt-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            {plural(onlineClassmates.length, 'classmate')} online
          </p>
        </div>
      </div>
    </section>
  );
};

export default WelcomeCard;
