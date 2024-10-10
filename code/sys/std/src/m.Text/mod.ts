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
import { diff } from './u.diff.ts';
import { replace, splice } from './u.splice.ts';

export const Text: t.TextLib = {
  diff,
  splice,
  replace,

  /**
   * Limit the length of a string inserting ellipsis when needed.
   */
  shorten(input: string = '', maxLength: number = 10, options: { ellipsis?: string } = {}) {
    const { ellipsis = '…' } = options;
    const text = String(input);
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - ellipsis.length)}${ellipsis}`;
  },
} as const;
