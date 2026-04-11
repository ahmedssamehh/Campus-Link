import React from 'react';

/**
 * Full-viewport loading state for lazy routes and heavy transitions.
 */
export default function PageLoader({ message = 'Loading…' }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-200"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 max-w-sm w-full text-center">
        <div
          className="h-12 w-12 rounded-full border-2 border-purple-200 dark:border-purple-900 border-t-purple-600 dark:border-t-purple-400 animate-spin motion-reduce:animate-none"
          aria-hidden
        />
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}
