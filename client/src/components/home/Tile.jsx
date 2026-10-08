import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '../ui/Icons';

const labelTones = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  indigo: 'text-indigo-500',
  orange: 'text-orange-500',
  rose: 'text-rose-500',
  slate: 'text-gray-600',
};

/** Widget-style surface: a small coloured symbol label, an optional action, then content. */
export const Tile = ({ label, Icon, tone = 'blue', action, className = '', index, children }) => (
  <section
    className={`flex min-w-0 flex-col rounded-[22px] bg-white p-5 sm:p-6 ${index !== undefined ? 'reveal' : ''} ${className}`}
    style={index !== undefined ? { '--reveal-delay': `${index * 60}ms` } : undefined}
  >
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className={`flex items-center gap-1.5 text-[13px] font-semibold tracking-normal ${labelTones[tone]}`}>
        <Icon className="h-4 w-4" strokeWidth={2.2} />
        {label}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

export const TileAction = ({ to, children, state }) => (
  <Link
    to={to}
    state={state}
    className="text-[13px] font-medium text-blue-600 transition-colors hover:text-blue-700"
  >
    {children}
  </Link>
);

/** Large one-line statement that leads a tile ("4 conversations waiting"). */
export const TileHeadline = ({ children, sub }) => (
  <div className="mb-3">
    <p className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-gray-900">{children}</p>
    {sub && <p className="mt-1 text-[15px] text-gray-500">{sub}</p>}
  </div>
);

/** Tappable list row with leading visual, two lines of text and a trailing accessory. */
export const TileRow = ({ to, state, leading, title, subtitle, trailing, chevron = true }) => (
  <Link
    to={to}
    state={state}
    className="press group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-black/[0.03]"
  >
    {leading}
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[15px] font-medium text-gray-900">{title}</span>
      {subtitle && <span className="block truncate text-[13px] text-gray-500">{subtitle}</span>}
    </span>
    {trailing}
    {chevron && <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-gray-300" />}
  </Link>
);

export const CountPill = ({ count }) =>
  count > 0 ? (
    <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold tabular-nums text-white">
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

export const TileSkeleton = ({ rows = 3 }) => (
  <div className="animate-pulse space-y-4" aria-hidden>
    <div className="h-6 w-1/2 rounded-md bg-gray-100" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-2/5 rounded bg-gray-100" />
          <div className="h-3 w-1/4 rounded bg-gray-100" />
        </div>
      </div>
    ))}
  </div>
);

export const TileEmpty = ({ Icon, title, children }) => (
  <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
    <Icon className="h-9 w-9 text-gray-300" strokeWidth={1.6} />
    <p className="mt-3 text-[15px] font-semibold text-gray-900">{title}</p>
    {children && <div className="mt-1 max-w-xs text-[13px] text-gray-500">{children}</div>}
  </div>
);
