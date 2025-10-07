import { type t, Arr, R } from './common.ts';

/**
 * Cycle a union string signal through a list of possible values.
 */
export const cycle: t.SignalLib['cycle'] = <T>(
  signal: t.Signal<T | undefined>,
  values: T[],
  forceValue?: T,
): T => {
  const next = forceValue !== undefined ? forceValue : wrangle.next(signal, values);
  signal.value = next;
  return next;
};

/**
 * Helpers
 */
const wrangle = {
  next<T>(signal: t.Signal<T | undefined>, values: T[]): T {
    const u = Arr.uniq(values);
    const index = u.findIndex((item) => R.equals(item, signal.value));
    return u[(index + 1) % u.length];
  },
} as const;
