import { Num } from '../common.ts';

export function optionalPositiveInt(input: number | undefined): number | undefined {
  if (!Num.Is.finite(input)) return undefined;
  const value = Math.floor(input);
  return value > 0 ? value : undefined;
}

export function nonNegativeInt(input: number | undefined, fallback: number): number {
  if (!Num.Is.finite(input)) return fallback;
  return Math.max(0, Math.floor(input));
}
