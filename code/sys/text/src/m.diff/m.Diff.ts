import { diffChars } from 'diff';

import type { t } from '../common.ts';
import type { DiffLib } from './t.ts';

/**
 * Helpers for determining differences between text strings.
 */
export const Diff: DiffLib = {
  /**
   * Calculate a list of diffs between two strings.
   */
  chars(from: string, to: string, options: { ignoreCase?: boolean } = {}): t.TextCharDiff[] {
    const { ignoreCase = false } = options;

    const changes = diffChars(from, to, { ignoreCase });

    const res: t.TextCharDiff[] = [];
    changes.forEach((item) => {
      const value = item.value;
      const kind = item.added ? 'Added' : item.removed ? 'Deleted' : 'Unchanged';
      res.push({ kind, value });
    });

    return res;
  },
};
