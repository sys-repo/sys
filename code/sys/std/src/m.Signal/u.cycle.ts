import { type t } from './common.ts';

/**
 * Cycle a union string signal through a list of possible values.
 */
export const cycle: t.SignalLib['cycle'] = <T extends string | number>(
  signal: { value: T | undefined },
  values: T[],
  forceValue?: T,
): T => {
  const next: T =
    forceValue !== undefined
      ? forceValue
      : (() => {
          const currentIndex = signal.value === undefined ? 0 : values.indexOf(signal.value);

          // If the current value isn't in the list, default to the first element.
          if (currentIndex === -1) return values[0];

          // Move to the next value, wrapping back to the start if at the end.
          return values[(currentIndex + 1) % values.length];
        })();

  signal.value = next;
  return next;
};
