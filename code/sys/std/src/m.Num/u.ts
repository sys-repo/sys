import { type t } from './common.ts';

/**
 * Rounds a number to the specified number of decimal places.
 */
export const round: t.Num.Lib['round'] = (value, precision) => {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * Clamps a number between a minimum and maximum value.
 */
export const clamp: t.Num.Lib['clamp'] = (min, max, value) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Sum a list of numbers (empty list → 0).
 */
export const sum: t.Num.Lib['sum'] = (values) => {
  let total = 0;
  for (const n of values) total += n;
  return total;
};
