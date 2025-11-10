import { type t } from './common.ts';

type F = t.StrLib['ellipsize'];

export const ellipsize: F = (text = '', max, opts = {}) => {
  const { ellipsis = '…' } = wrangle.opts(opts);

  // Normalize input:
  if (!text) return '';

  // Helper: clamp to non-negative finite integers:
  const clamp = (n: unknown) =>
    Number.isFinite(n as number) && (n as number) > 0 ? Math.floor(n as number) : 0;

  // Handle tuple form [left, right]:
  if (Array.isArray(max)) {
    const left = clamp(max[0]);
    const right = clamp(max[1]);
    const budget = left + right + ellipsis.length;

    if (budget === 0) return ''; // no room for anything
    if (text.length <= budget) return text;

    const head = left > 0 ? text.slice(0, left) : '';
    const tail = right > 0 ? text.slice(text.length - right) : '';

    // Ensure result length does not exceed budget even if custom ellipsis is long
    const ell = ellipsis.length > budget ? ellipsis.slice(0, budget) : ellipsis;
    const roomForEnds = budget - ell.length;

    // If custom ellipsis consumed all budget, return it
    if (roomForEnds <= 0) return ell;

    // If left+right exceeds room (shouldn't with clamp, but guard anyway)
    const leftFinal = Math.min(head.length, roomForEnds);
    const rightFinal = Math.min(tail.length, roomForEnds - leftFinal);

    return `${head.slice(0, leftFinal)}${ell}${tail.slice(tail.length - rightFinal)}`;
  }

  // Scalar form:
  const total = clamp(max);
  if (total === 0) return '';
  if (text.length <= total) return text;

  // If ellipsis alone exceeds total, truncate ellipsis:
  if (ellipsis.length >= total) return ellipsis.slice(0, total);

  const remain = total - ellipsis.length; // space for start+end
  // Split evenly, favor start on odd remain:
  let startLen = Math.ceil(remain / 2);
  let endLen = Math.floor(remain / 2);

  // Safety guards (should not go negative)
  startLen = Math.max(0, startLen);
  endLen = Math.max(0, endLen);

  const head = startLen > 0 ? text.slice(0, startLen) : '';
  const tail = endLen > 0 ? text.slice(text.length - endLen) : '';

  return `${head}${ellipsis}${tail}`;
};

/**
 * Helpers:
 */
const wrangle = {
  opts(input?: { ellipsis?: string } | string) {
    if (!input) return {};
    if (typeof input === 'string') return { ellipsis: input };
    return input;
  },
} as const;
