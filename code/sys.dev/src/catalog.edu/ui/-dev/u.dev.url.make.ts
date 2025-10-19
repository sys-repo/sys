import { type t } from './common.ts';
import { changeDevUrl } from './u.dev.url.change.ts';
import { readDevUrl } from './u.dev.url.read.ts';

/**
 * Create a DevUrl proxy bound to a specific window or location-like object.
 *
 * @example
 *   const devUrl = make(window);
 *   devUrl.debug = true;   // adds ?debug=true
 *   devUrl.debug = false;  // sets ?debug=false
 *   devUrl.debug = null;   // removes ?debug
 */
export const makeDevUrl: t.DevUrlMake = (win) => {
  return new Proxy(
    {},
    {
      get(_, key) {
        if (key === 'debug') {
          return readDevUrl(win.location.href).showDebug;
        }
        throw new Error(`Unknown devUrl property: ${String(key)}`);
      },
      set(_, key, value) {
        if (key === 'debug') {
          const next = changeDevUrl(win.location.href, { showDebug: value });
          win.history.replaceState(null, '', next.href);
          return true;
        }
        throw new Error(`Unknown devUrl property: ${String(key)}`);
      },
    },
  ) as t.DevUrlProxy;
};
