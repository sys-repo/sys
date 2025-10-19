import { type t } from './common.ts';

/**
 * Return a new URL instance with query params updated from a partial DevUrlConfig.
 *
 * Notes:
 * - Only keys PRESENT on `value` are applied; all others are left unchanged.
 * - If `showDebug === null`, the `debug` param is removed.
 * - If `showDebug === true|false`, the `debug` param is set to "true"/"false".
 * - The input URL is never mutated; a cloned URL is always returned.
 *
 * @example
 *   const base = new URL('https://example.com/?x=1&debug=false');
 *   const next = changeDevUrl(base, { showDebug: true });
 *   // next.href → "https://example.com/?x=1&debug=true"
 *   // base.href remains unchanged.
 */
export const changeDevUrl: t.ChangeDevUrl = (input, value) => {
  // Clone the input (string gets a localhost base; URL gets stringified and re-parsed).
  const url =
    typeof input === 'string' ? new URL(input, 'http://localhost') : new URL(input.toString());

  const q = url.searchParams;

  // Apply only fields that are explicitly present on the partial.
  if ('showDebug' in value) {
    const v = value.showDebug;
    if (v === null) {
      q.delete('debug');
    } else {
      q.set('debug', String(v));
    }
  }

  // Return a fresh URL instance.
  return new URL(url.toString());
};
