import type { t } from './common.ts';
import { deep as equals, unique } from '../m.Eql/m.Eql.ts';

/**
 * Cycle a union string signal through a list of possible values.
 */
export const cycle: t.Signal.Lib['cycle'] = <T>(
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
    const u = unique(values);
    const index = u.findIndex((item) => equals(item, signal.value));
    return u[(index + 1) % u.length];
  },
} as const;

