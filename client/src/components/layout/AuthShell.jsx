import React from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, CapIcon, ChatIcon, HelpIcon, MegaphoneIcon, UsersIcon } from '../ui/Icons';

const features = [
  { label: 'Study groups', Icon: UsersIcon },
  { label: 'Real-time chat', Icon: ChatIcon },
  { label: 'Q&A boards', Icon: HelpIcon },
  { label: 'Announcements', Icon: BellIcon },
];

export const authInputClass = (hasError) =>
  `w-full min-h-[48px] rounded-xl border bg-white px-4 py-3 text-[15px] text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:outline-none focus:ring-4 disabled:opacity-60 dark:bg-gray-800 dark:text-white ${
    hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/15 dark:border-gray-700'
  }`;

export const authButtonClass =
  'w-full min-h-[48px] rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-3 font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0';

export const Spinner = () => (
  <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const Brand = ({ className = '' }) => (
  <Link to="/login" className={`flex items-center gap-3 ${className}`}>
    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-glow">
      <CapIcon className="h-6 w-6" />
    </span>
    <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Campus Link</span>
  </Link>
);

const AuthShell = ({ title, subtitle, children }) => (
  <div className="bg-grid-soft relative flex min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-gray-900">
    <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-600/10" />
    <div className="pointer-events-none absolute -bottom-48 right-0 h-[480px] w-[480px] rounded-full bg-sky-300/20 blur-3xl dark:bg-blue-500/10" />

    {/* Brand / pitch panel */}
    <aside className="relative hidden flex-1 flex-col justify-between px-12 py-12 lg:flex xl:px-20">
      <Brand />
      <div className="max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
          Campus Link · Student platform
        </p>
        <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-[-0.04em] text-gray-900 dark:text-white xl:text-6xl">
          Your whole campus.
          <span className="block bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-600">
            One link away.
          </span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
          Study groups, live chat, Q&amp;A boards and announcements, in one place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {features.map(({ label, Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-200"
            >
              <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Floating notification preview */}
      <div className="flex max-w-sm items-center gap-3 rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-800/90">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-glow">
          <MegaphoneIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Stay in the loop</p>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">Announcements from your groups, instantly.</p>
        </div>
      </div>
    </aside>

    {/* Form panel */}
    <main className="relative flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:max-w-[560px] lg:px-10">
      <div className="w-full max-w-md">
        <Brand className="mb-8 justify-center lg:hidden" />
        <div className="rounded-3xl border border-gray-100 bg-white/95 p-6 shadow-2xl backdrop-blur dark:border-gray-700/60 dark:bg-gray-800/95 sm:p-8 animate-fade-up">
          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-[28px]">{title}</h2>
            {subtitle && <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </main>
  </div>
);

export default AuthShell;
