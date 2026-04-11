import React from 'react';

/**
 * Consistent empty / no-data UI. Fully responsive; pass icon as React node or emoji string.
 */
export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40 px-4 py-10 sm:py-12 text-center transition-colors duration-200 ${className}`}
    >
      {icon && (
        <div className="mb-4 flex justify-center text-4xl sm:text-5xl text-gray-400 dark:text-gray-500" aria-hidden>
          {typeof icon === 'string' ? <span role="img">{icon}</span> : icon}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
