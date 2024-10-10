/**
 * @module
 * Tools for working on strings of text.
 *
 * @example
 * ```ts
 * import { Text } from '@sys/std/text';
 *
 * const long = 'hello world.'.repeat(100)'
 * const short = Text.shorten(long);
 * ```
 */

import type { t } from './common.ts';
import { capitalize } from './u.caps.ts';
import { diff } from './u.diff.ts';
import { shorten } from './u.shorten.ts';
import { replace, splice } from './u.splice.ts';

export { capitalize, diff, replace, shorten, splice };

export const Text: t.TextLib = {
  diff,
  splice,
  replace,
  shorten,
  capitalize,
} as const;
