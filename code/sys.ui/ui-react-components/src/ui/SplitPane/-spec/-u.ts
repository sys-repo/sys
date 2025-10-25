export { normalize } from '../u.ts';

export function even(n: number = 0) {
  const len = Math.max(1, n);
  const r = 1 / len;
  return Array.from({ length: len }, () => r);
}

export function toScalar(arr: number[] | undefined): number | undefined {
  return Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;
}

export function toArray2(v: number | undefined): number[] | undefined {
  if (typeof v !== 'number') return undefined;
  const x = clamp01(v);
  return [x, clamp01(1 - x)] as const;
}

export function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function labelOnly(curr?: number) {
  return curr === 0 ? 'A' : curr === 1 ? 'B' : '(undefined)';
}
