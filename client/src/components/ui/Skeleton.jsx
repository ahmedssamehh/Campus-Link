import React from 'react';

function pulse(className = '') {
  return `animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`;
}

export function SkeletonLine({ className = '' }) {
  return <div className={pulse(`h-4 ${className}`)} aria-hidden />;
}

export function SkeletonAnnouncementCard() {
  return (
    <div className="border-l-4 border-gray-200 dark:border-gray-600 p-4 rounded-r-lg space-y-3">
      <SkeletonLine className="w-3/5 h-5" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-4/5" />
      <div className="flex gap-3 pt-1">
        <SkeletonLine className="w-24 h-3" />
        <SkeletonLine className="w-16 h-3" />
      </div>
    </div>
  );
}

export function SkeletonStatsCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between mb-4">
        <div className={pulse('h-12 w-12 rounded-lg')} />
      </div>
      <SkeletonLine className="w-24 h-4 mb-3" />
      <SkeletonLine className="w-16 h-9 mb-2" />
      <SkeletonLine className="w-32 h-3" />
    </div>
  );
}
