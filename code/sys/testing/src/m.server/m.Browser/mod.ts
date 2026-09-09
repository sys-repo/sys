/**
 * @module
 * Isolated browser assertions and fixed Service Worker lifecycle observations.
 *
 * The public surface exposes neither generic page evaluation nor the internal Chrome/CDP session.
 */
import { Is, type t } from './common.ts';
import { loadChrome } from './u.chrome.ts';
import { validateChromeExecutable } from './u.chrome.executable.ts';
import { serviceWorkerScenario } from './u.service-worker.ts';

export const Browser: t.Browser.Lib = Object.freeze({
  Executable: Object.freeze({
    admit(input: unknown, options: t.Browser.Executable.Options) {
      if (!Is.record(options) || !Is.array(options.writableRoots)) {
        return Promise.reject(
          new TypeError('Browser.Executable.admit requires an explicit writableRoots array.'),
        );
      }
      const writableRoots = Object.freeze([...options.writableRoots]);
      return validateChromeExecutable(input, { writableRoots });
    },
  }),
  load(url, options = {}) {
    const browser = options.browser ?? 'Chrome';
    if (browser === 'Chrome') return loadChrome(url, options);
    return Promise.reject(new Error(`Unsupported browser: ${browser}`));
  },
  ServiceWorker: Object.freeze({ scenario: serviceWorkerScenario }),
});
