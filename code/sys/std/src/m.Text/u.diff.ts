import type { t } from './common.ts';

/**
 * Calculate a diff between two string providing parameters to pass
 * into a `.splice(..)` function.
 *
 * Ref:
 *    https://automerge.org/automerge/api-docs/js/functions/next.splice.html
 */
export const diff: t.TextDiffCalc = (from, to, caret) => {
  const index = wrangle.firstDiff(from, to);
  const commonSuffixLength = wrangle.commonSuffixLength(from, to, index);
  const delCount = from.length - index - commonSuffixLength;
  const newText = to.slice(index, caret);
  return { index, delCount, newText };
};

/**
 * Helpers
 */
const wrangle = {
  firstDiff(from: string, to: string) {
    let i = 0;
    while (i < from.length && i < to.length && from[i] === to[i]) {
      i++;
    }
    return i;
  },

  commonSuffixLength(from: string, to: string, index: number) {
    let i = 0;
    while (
      i < from.length - index &&
      i < to.length - index &&
      from[from.length - 1 - i] === to[to.length - 1 - i]
    ) {
      i++;
    }
    return i;
  },
} as const;
