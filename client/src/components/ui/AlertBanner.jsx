import React from 'react';

const variants = {
  error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
  info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
};

export default function AlertBanner({ variant = 'error', children, className = '', role = 'alert' }) {
  return (
    <div
      role={role}
      className={`rounded-lg border px-3 py-2.5 sm:px-4 text-sm sm:text-base transition-colors duration-200 ${variants[variant] || variants.error} ${className}`}
    >
      {children}
    </div>
  );
}
