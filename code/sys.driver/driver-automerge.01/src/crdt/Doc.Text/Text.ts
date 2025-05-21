import { Str } from '@sys/std';
import { replace, splice } from './Text.splice.ts';

const diff = Str.diff;

/**
 * Syncer for a text <input> element.
 */
export const Text = {
  diff,
  splice,
  replace,
} as const;
