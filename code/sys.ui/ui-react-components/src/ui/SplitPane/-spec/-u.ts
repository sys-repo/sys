import { type t, Num } from '../common.ts';
export { normalize } from '../u.ts';

export function toLetter(i: t.Index) {
  return String.fromCharCode((i % 26) + 65);
}

export function even(n: number = 0) {
  const len = Math.max(1, n);
  const r = 1 / len;
  return Array.from({ length: len }, () => r);
}

export function toScalar(arr: number[] | undefined): number | undefined {
  return Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;
}

/**
 * Build an n-length ratios array from a scalar `x` (0..1).
 * The `focus` pane gets `x`, the remainder is split evenly.
 */
export function fromScalar(n: number, x: number | undefined, focus = 0): number[] | undefined {
  if (typeof x !== 'number' || n <= 0) return undefined;
  const N = Math.max(1, n);
  const F = Math.max(0, Math.min(N - 1, focus)) | 0;
  const X = Num.clamp(0, 1, x);

  if (N === 1) return [1];

  const rest = Math.max(0, 1 - X);
  const each = rest / (N - 1);

  const out = Array.from({ length: N }, () => each);
  out[F] = X;
  return out;
}
