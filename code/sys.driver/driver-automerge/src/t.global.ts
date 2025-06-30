import type { t } from './common.ts';

/**
 * Add the repo to the global window object so
 * it can be accessed in the browser console.
 */
declare global {
  interface Window {
    repo: t.CrdtRepo;
  }
}
