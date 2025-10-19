import { type t } from './common.ts';

/**
 * Interpret configuration cues embedded in a dev URL.
 *
 * For example:
 *   /?debug
 *   /?debug=true
 *   /?debug=1
 *   /?debug=false
 *
 * @example
 *   readDevUrl('http://localhost:5173/?debug');
 *   // → { showDebug: true }
 */
export const readDevUrl: t.ReadDevUrl = (input) => {
  const url = typeof input === 'string' ? new URL(input, 'http://localhost') : input;
  const q = url.searchParams;

  const has = q.has('debug');
  if (!has) return { showDebug: null };

  const value = q.get('debug');
  const normalized = value?.toLowerCase();

  const truthy = ['1', 'true', 'yes', 'on', ''];
  const falsy = ['0', 'false', 'no', 'off'];

  if (normalized && falsy.includes(normalized)) return { showDebug: false };
  if (normalized && truthy.includes(normalized)) return { showDebug: true };
  if (has && value === null) return { showDebug: true };

  // Fallback: default to true if key exists, false otherwise.
  return { showDebug: has };
};
