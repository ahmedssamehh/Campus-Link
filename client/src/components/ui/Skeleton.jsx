import React from 'react';

function pulse(className = '') {
  return `animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`;
}

export function SkeletonLine({ className = '' }) {
  return <div className={pulse(`h-4 ${className}`)} aria-hidden />;
}

export function SkeletonAnnouncementCard() {
  return (
    <div className="flex gap-3 rounded-xl border border-gray-100 p-4 dark:border-gray-700/60">
      <div className={pulse('h-10 w-10 flex-shrink-0 rounded-xl')} />
      <div className="flex-1 space-y-2.5">
        <SkeletonLine className="w-3/5" />
        <SkeletonLine className="w-full h-3" />
        <SkeletonLine className="w-2/5 h-3" />
      </div>
    </div>
  );
}

export function SkeletonStatsCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-gray-700/60 dark:bg-gray-800">
      <div className={pulse('h-12 w-12 rounded-2xl')} />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="w-24 h-3.5" />
        <SkeletonLine className="w-12 h-7" />
      </div>
    </div>
  );
}
