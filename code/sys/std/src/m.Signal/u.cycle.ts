import { type t, R } from './common.ts';

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
    const index = values.findIndex((item) => R.equals(item, signal.value));
    return values[(index + 1) % values.length];
  },
} as const;
