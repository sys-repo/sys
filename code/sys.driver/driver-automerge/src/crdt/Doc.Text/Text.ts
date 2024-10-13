import { diff } from '@sys/std/text';
import { replace, splice } from './Text.splice.ts';

/**
 * Syncer for a text <input> element.
 */
export const Text = {
  diff,
  splice,
  replace,
} as const;
