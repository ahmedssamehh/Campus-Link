import React from 'react';
import { CapIcon } from './Icons';

/**
 * Full-viewport loading state for lazy routes and heavy transitions.
 */
export default function PageLoader({ message = 'Loading…' }) {
  return (
    <div
      className="bg-grid-soft min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-200"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-5 max-w-sm w-full text-center">
        <div className="relative" aria-hidden>
          <span className="absolute inset-0 rounded-2xl bg-blue-500/30 animate-ping motion-reduce:animate-none" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-glow">
            <CapIcon className="h-7 w-7" />
          </span>
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}
