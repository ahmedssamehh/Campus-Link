import React from 'react';

const variants = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
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
