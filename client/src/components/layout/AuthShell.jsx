import React from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, ChatIcon, HelpIcon, UsersIcon } from '../ui/Icons';
import { BrandMark, Wordmark } from '../brand/Brand';

const features = [
  { label: 'Study groups', Icon: UsersIcon },
  { label: 'Real-time chat', Icon: ChatIcon },
  { label: 'Q&A boards', Icon: HelpIcon },
  { label: 'Announcements', Icon: BellIcon },
];

export const authInputClass = (hasError) =>
  `w-full h-11 rounded-xl border bg-gray-100 px-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-4 disabled:opacity-60 ${
    hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
      : 'border-transparent focus:border-blue-500 focus:ring-blue-500/15'
  }`;

export const authButtonClass =
  'press w-full h-11 rounded-xl bg-blue-600 px-4 text-[15px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60';

export const Spinner = () => (
  <svg className="-ml-1 mr-2.5 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const Brand = ({ className = '' }) => (
  <Link to="/login" aria-label="Campus Link" className={`brand-hover inline-flex items-center gap-3 ${className}`}>
    <BrandMark size={40} />
    <Wordmark size="lg" />
  </Link>
);

const AuthShell = ({ title, subtitle, children }) => (
  <div className="flex min-h-screen w-full overflow-x-hidden bg-white">
    {/* Pitch panel */}
    <aside className="hidden flex-1 flex-col justify-between bg-gray-50 px-12 py-12 lg:flex xl:px-20">
      <Brand />
      <div className="max-w-lg">
        <h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.035em] text-gray-900 xl:text-[56px]">
          Your whole campus.
          <span className="block text-blue-600">One link away.</span>
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-gray-500">
          Study groups, live chat, Q&amp;A boards and announcements, in one place.
        </p>
        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4">
          {features.map(({ label, Icon }) => (
            <li key={label} className="flex items-center gap-3 text-[15px] font-medium text-gray-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm text-gray-400">© {new Date().getFullYear()} Campus Link</p>
    </aside>

    {/* Form panel */}
    <main className="flex w-full flex-1 items-center justify-center px-5 py-10 sm:px-6 lg:max-w-[540px] lg:px-12">
      <div className="w-full max-w-[380px]">
        <Brand className="mb-10 lg:hidden" />
        <div className="mb-8">
          <h2 className="text-[28px] font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1.5 text-[15px] text-gray-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </main>
  </div>
);

export default AuthShell;
