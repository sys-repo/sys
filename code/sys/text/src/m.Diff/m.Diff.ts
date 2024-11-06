import { diffChars } from 'diff';
import type { t } from '../common.ts';

/**
 * Helpers for determining differences between text strings.
 */
export const Diff: t.DiffLib = {
  /**
   * Calculate a list of diffs between two strings.
   */
  chars(from: string, to: string, options: { ignoreCase?: boolean } = {}): t.TextCharDiff[] {
    const { ignoreCase = false } = options;

    const changes = diffChars(from, to, { ignoreCase });
    const res: t.TextCharDiff[] = [];

    let index = 0;
    changes.forEach((item: any) => {
      const value = item.value;
      const kind = item.added ? 'Added' : item.removed ? 'Deleted' : 'Unchanged';
      res.push({ kind, index, value });
      index += value.length;
    });

    return res;
  },
};
