import { type t } from './common.ts';

/**
 * Cycle a union string signal through a list of possible values.
 */
export const cycle: t.SignalLib['cycle'] = <T>(
  signal: t.Signal<T | undefined>,
  values: T[],
  forceValue?: T,
): T => {
  const next: T =
    forceValue !== undefined
      ? forceValue
      : (() => {
          const currentIndex = values.indexOf(signal.value as T);
          return values[(currentIndex + 1) % values.length];
        })();

  signal.value = next;
  return next;
};
