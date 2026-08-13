/**
 * @module
 * Isolated browser assertions and fixed Service Worker lifecycle observations.
 *
 * The public surface exposes neither generic page evaluation nor the internal Chrome/CDP session.
 */
import type { t } from './common.ts';
import { loadChrome } from './u.chrome.ts';
import { serviceWorkerScenario } from './u.service-worker.ts';

export const Browser: t.Browser.Lib = Object.freeze({
  load(url, options = {}) {
    const browser = options.browser ?? 'Chrome';
    if (browser === 'Chrome') return loadChrome(url, options);
    return Promise.reject(new Error(`Unsupported browser: ${browser}`));
  },
  ServiceWorker: Object.freeze({ scenario: serviceWorkerScenario }),
});
