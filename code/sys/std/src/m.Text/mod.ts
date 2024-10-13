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
 * const caps = Text.capitalize(short);
 * ```
 */
import type { t } from './common.ts';
import { capitalize } from './u.caps.ts';
import { diff } from './u.diff.ts';
import { plural } from './u.plural.ts';
import { shorten } from './u.shorten.ts';
import { replace, splice } from './u.splice.ts';

export { capitalize, diff, plural, replace, shorten, splice };

export const Text: t.TextLib = {
  diff,
  splice,
  replace,
  shorten,
  capitalize,
  plural,
} as const;
