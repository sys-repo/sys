import { type t } from './common.ts';

/**
 * Rounds a number to the specified number of decimal places.
 */
export const round: t.NumberLib['round'] = (value, precision) => {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * Clamps a number between a minimum and maximum value.
 */
export const clamp: t.NumberLib['clamp'] = (min, max, value) => {
  return Math.max(min, Math.min(max, value));
};
