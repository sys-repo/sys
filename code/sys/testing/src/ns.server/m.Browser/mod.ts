/**
 * @module
 * Lightweight browser-load assertions for built web assets.
 *
 * Exposes an abstract `Browser.load(...)` seam for loading a URL in an installed
 * browser and reporting runtime errors, without pulling in heavier automation
 * frameworks.
 */
import type { t } from './common.ts';
import { loadChrome } from './u.chrome.ts';

export const Browser: t.Browser.Lib = {
  load(url, options = {}) {
    const browser = options.browser ?? 'Chrome';
    if (browser === 'Chrome') return loadChrome(url, options);
    return Promise.reject(new Error(`Unsupported browser: ${browser}`));
  },
};
