import { lens } from './m.Crop.lens.ts';
import { resolveEnd, toRange } from './m.Crop.u.ts';

/**
 * Helpers for working with the `crop` property:
 */
export const Crop = {
  lens,
  toRange,
  resolveEnd,
} as const;
