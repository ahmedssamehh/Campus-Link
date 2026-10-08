import { lazy } from 'react';

const RELOAD_KEY = 'campusLinkChunkReload';

const isChunkError = (error) =>
  error?.name === 'ChunkLoadError' || /Loading (CSS )?chunk [\w-]+ failed/i.test(error?.message || '');

/**
 * React.lazy with recovery for stale code chunks (e.g. after a new deploy, or when the
 * dev server restarts). Retries once, then reloads the page a single time to pick up the
 * current build. A session flag prevents reload loops; if it still fails, the error surfaces.
 */
const lazyWithRetry = (factory) =>
  lazy(async () => {
    try {
      const mod = await factory();
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        // storage unavailable — nothing to clear
      }
      return mod;
    } catch (error) {
      if (!isChunkError(error)) throw error;

      // A brief network hiccup: try once more.
      try {
        await new Promise((r) => setTimeout(r, 500));
        return await factory();
      } catch {
        // fall through to a one-time reload
      }

      let alreadyReloaded = false;
      try {
        alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === '1';
        if (!alreadyReloaded) sessionStorage.setItem(RELOAD_KEY, '1');
      } catch {
        alreadyReloaded = true; // can't guard against loops without storage
      }

      if (!alreadyReloaded) {
        window.location.reload();
        // Keep Suspense showing its fallback until the reload happens.
        return new Promise(() => {});
      }
      throw error;
    }
  });

export default lazyWithRetry;
