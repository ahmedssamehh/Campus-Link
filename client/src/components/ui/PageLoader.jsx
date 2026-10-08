import React from 'react';
import { BrandMark, Wordmark } from '../brand/Brand';

/**
 * Full-viewport loading state (app start, lazy routes): the mark draws itself in,
 * then the wordmark rises beneath it.
 */
export default function PageLoader({ message = 'Loading…' }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center text-center">
        <BrandMark size={72} animated />
        <Wordmark size="xl" className="brand-rise mt-5" />
        <span className="sr-only">{message}</span>
      </div>
    </div>
  );
}
