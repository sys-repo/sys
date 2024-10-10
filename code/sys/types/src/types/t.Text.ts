import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * A generic splicer function to apply a
 * detailed "unit of change" to a string.
 */
export type TextSplice = <T extends O>(
  doc: T,
  path: t.ObjectPath,
  index: t.Index,
  delCount: number,
  newText?: string,
) => void;

/**
 * Calculate a diff between two string providing parameters to pass
 * into a `.splice(..)` function.
 *
 * Ref:
 *    https://automerge.org/automerge/api-docs/js/functions/next.splice.html
 */
export type TextDiffCalc = (from: string, to: string, caret: number) => t.TextDiff;

/**
 * A unit of difference within a string of text.
 */
export type TextDiff = {
  readonly index: number;
  readonly delCount: number;
  readonly newText?: string;
};
