import type { t } from '../common.ts';

export type TextCharDiff = {
  kind: TextDiffKind;
  index: number;
  value: string;
};
export type TextDiffKind = 'Added' | 'Deleted' | 'Unchanged';

/**
 * Helpers for determining differences between text strings.
 */
export type DiffLib = {
  /**
   * Calculate a list of diffs between two strings.
   */
  chars(from: string, to: string, options?: { ignoreCase?: boolean }): t.TextCharDiff[];
};
