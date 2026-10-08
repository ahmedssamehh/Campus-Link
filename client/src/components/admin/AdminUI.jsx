import React from 'react';
import { CountUp, Reveal, Shimmer } from '../ui/motion';
import { MoreIcon, SearchIcon } from '../ui/Icons';

export const SectionHeader = ({ title, description, actions }) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-gray-900">{title}</h2>
      {description && <p className="mt-0.5 text-[15px] text-gray-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

const toneText = {
  blue: 'text-blue-600',
  indigo: 'text-indigo-500',
  orange: 'text-orange-500',
  green: 'text-green-600',
  teal: 'text-teal-600',
  red: 'text-red-500',
  gray: 'text-gray-500',
};

/** Summary figure that counts up on load. */
export const StatTile = ({ label, value, Icon, tone = 'blue', note, loading, index = 0, onClick }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Reveal index={index}>
      <Tag
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className={`block h-full w-full rounded-[20px] bg-white p-5 text-left ${onClick ? 'press lift cursor-pointer' : ''}`}
      >
        <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${toneText[tone]}`}>
          {Icon && <Icon className="h-4 w-4" strokeWidth={2.2} />}
          {label}
        </span>
        {loading ? (
          <Shimmer className="mt-3 h-8 w-16" />
        ) : (
          <span className="mt-2 block text-[32px] font-semibold leading-none tracking-[-0.02em] text-gray-900">
            <CountUp value={value ?? 0} />
          </span>
        )}
        {note && <span className="mt-2 block text-[13px] text-gray-500">{note}</span>}
      </Tag>
    </Reveal>
  );
};

export const Panel = ({ className = '', children }) => (
  <section className={`rounded-[22px] bg-white ${className}`}>{children}</section>
);

export const PanelHeader = ({ title, actions }) => (
  <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-5 sm:px-6">
    <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-gray-900">{title}</h3>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const SearchField = ({ value, onChange, placeholder = 'Search', className = '' }) => (
  <div className={`relative ${className}`}>
    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-[10px] border border-transparent bg-black/[0.05] pl-9 pr-3 text-[15px] transition-colors placeholder:text-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 sm:text-sm"
    />
  </div>
);

export const EmptyState = ({ Icon, title, children, action }) => (
  <div className="flex flex-col items-center px-6 py-14 text-center">
    {Icon && <Icon className="h-10 w-10 text-gray-300" strokeWidth={1.6} />}
    <p className="mt-3 text-[17px] font-semibold text-gray-900">{title}</p>
    {children && <p className="mt-1 max-w-sm text-[15px] text-gray-500">{children}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const RowSkeleton = ({ rows = 5 }) => (
  <div className="divide-y divide-gray-100">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-5 py-4 sm:px-6">
        <Shimmer className="h-10 w-10 !rounded-full" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-3.5 w-1/3" />
          <Shimmer className="h-3 w-1/5" />
        </div>
      </div>
    ))}
  </div>
);

export const ErrorBanner = ({ message, onRetry }) => (
  <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 text-[15px] text-red-700">
    <span>{message}</span>
    {onRetry && (
      <button type="button" onClick={onRetry} className="font-semibold text-red-700 underline-offset-4 hover:underline">
        Try again
      </button>
    )}
  </div>
);

export const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** Overflow menu for row actions; grows from its trigger (top-right). */
export const RowMenu = ({ items, label = 'More actions' }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!items.length) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`press flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-black/[0.05] hover:text-gray-900 ${open ? 'bg-black/[0.05] text-gray-900' : ''}`}
      >
        <MoreIcon className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-52 origin-top-right overflow-hidden rounded-xl border border-black/[0.06] bg-white/95 py-1.5 shadow-xl backdrop-blur-xl animate-scale-in"
        >
          {items.map(({ label: itemLabel, Icon, onClick, danger }) => (
            <button
              key={itemLabel}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onClick();
              }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[14px] font-medium transition-colors ${
                danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-800 hover:bg-gray-50'
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
