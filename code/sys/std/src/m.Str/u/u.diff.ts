import type { t } from '../common.ts';

/**
 * Calculate a string difference as parameters for a `.splice(...)` call.
 *
 * @see https://automerge.org/automerge/api-docs/js/functions/next.splice.html
 */
export const diff: t.TextDiffCalc = (from, to, caret) => {
  const index = firstDiff(from, to);
  const commonSuffix = commonSuffixLength(from, to, index);
  const delCount = from.length - index - commonSuffix;
  const newText = to.slice(index, caret);
  return { index, delCount, newText };
};

/**
 * Helpers:
 */
function firstDiff(from: string, to: string) {
  // Paired code-unit scan requires positional control across both strings.
  let index = 0;
  while (index < from.length && index < to.length && from[index] === to[index]) {
    index += 1;
  }
  return index;
}

function commonSuffixLength(from: string, to: string, index: number) {
  // Reverse paired scan stops before the already-shared prefix.
  let offset = 0;
  while (
    offset < from.length - index &&
    offset < to.length - index &&
    from[from.length - 1 - offset] === to[to.length - 1 - offset]
  ) {
    offset += 1;
  }
  return offset;
}
