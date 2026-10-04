import React from 'react';
import { Link } from 'react-router-dom';

const tones = {
  blue: 'from-blue-400 to-blue-600',
  navy: 'from-blue-600 to-blue-900',
  sky: 'from-sky-400 to-blue-500',
};

/**
 * Overview stat tile: gradient icon, label + big number, optional pill and link.
 */
const StatsCard = ({ title, value, icon, tone = 'blue', pill, to, delay = 0 }) => {
  const body = (
    <>
      <div
        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone] || tones.blue} text-white shadow-glow`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-0.5 text-3xl font-bold tracking-tight text-gray-900 tabular-nums dark:text-white">{value}</p>
      </div>
      {pill && (
        <span className="self-start whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
          {pill}
        </span>
      )}
      <span className="pointer-events-none absolute inset-x-6 bottom-0 h-[3px] rounded-t-full bg-gradient-to-r from-blue-500 to-blue-700 opacity-0 transition-opacity group-hover:opacity-100" />
    </>
  );

  const cls =
    'group relative flex min-w-0 items-center gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700/60 dark:bg-gray-800 animate-fade-up';

  return to ? (
    <Link to={to} className={cls} style={{ animationDelay: `${delay}ms` }}>
      {body}
    </Link>
  ) : (
    <div className={cls} style={{ animationDelay: `${delay}ms` }}>
      {body}
    </div>
  );
};

export default StatsCard;
