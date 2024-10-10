import { diff } from './u.diff.ts';
import { replace, splice } from './u.splice.ts';

export const Text = {
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
