import React, { useMemo } from 'react';
import { Shimmer } from '../ui/motion';

const DAYS = 14;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/**
 * Stacked daily bars for the last 14 days: people joining vs groups being created.
 * Bars grow from the baseline with a short stagger; values are readable on hover/focus.
 */
const ActivityChart = ({ activities = [], loading }) => {
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    const buckets = Array.from({ length: DAYS }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (DAYS - 1 - i));
      return { date, users: 0, groups: 0 };
    });
    activities.forEach((a) => {
      const idx = Math.round((startOfDay(a.date) - buckets[0].date) / 86400000);
      if (idx >= 0 && idx < DAYS) buckets[idx][a.type === 'group' ? 'groups' : 'users'] += 1;
    });
    return buckets;
  }, [activities]);

  const max = Math.max(1, ...days.map((d) => d.users + d.groups));
  const totals = days.reduce((acc, d) => ({ users: acc.users + d.users, groups: acc.groups + d.groups }), { users: 0, groups: 0 });
  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex h-48 items-end gap-2 px-1" aria-hidden>
        {Array.from({ length: DAYS }).map((_, i) => (
          <Shimmer key={i} className="flex-1 !rounded-md" style={{ height: `${20 + ((i * 37) % 70)}%` }} />
        ))}
      </div>
    );
  }

  return (
    <figure>
      <figcaption className="sr-only">
        In the last {DAYS} days, {totals.users} people joined and {totals.groups} groups were created.
      </figcaption>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
          New members <strong className="font-semibold text-gray-900 tabular-nums">{totals.users}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-indigo-400" />
          New groups <strong className="font-semibold text-gray-900 tabular-nums">{totals.groups}</strong>
        </span>
      </div>

      <div className="relative">
        {/* quiet gridlines */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-gray-200" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-[calc(50%-12px)] border-t border-dashed border-gray-100" aria-hidden />
        <span className="pointer-events-none absolute -top-2.5 right-0 bg-white pl-1 text-[11px] text-gray-400 tabular-nums">{max}</span>

        <div className="flex h-52 gap-1.5 sm:gap-2">
          {days.map((d, i) => {
            const total = d.users + d.groups;
            const isToday = i === DAYS - 1;
            return (
              <div key={i} className="group relative flex h-full flex-1 flex-col" tabIndex={0} aria-label={`${fmt(d.date)}: ${d.users} new members, ${d.groups} new groups`}>
                {/* tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-[12px] text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100">
                  <span className="block font-semibold">{fmt(d.date)}</span>
                  {d.users} members · {d.groups} groups
                </div>
                <div className="flex flex-1 items-end">
                  {total === 0 ? (
                    <div className="h-1 w-full rounded-full bg-gray-100" />
                  ) : (
                    <div
                      className="grow-up flex w-full flex-col overflow-hidden rounded-md transition-opacity group-hover:opacity-80"
                      style={{ height: `${(total / max) * 100}%`, '--reveal-delay': `${i * 30}ms` }}
                    >
                      {d.groups > 0 && <div className="bg-indigo-400" style={{ flexGrow: d.groups }} />}
                      {d.users > 0 && <div className="bg-blue-600" style={{ flexGrow: d.users }} />}
                    </div>
                  )}
                </div>
                <span className={`mt-2 text-center text-[11px] tabular-nums ${isToday ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                  {i % 2 === 1 || isToday ? d.date.getDate() : ' '}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </figure>
  );
};

export default ActivityChart;
