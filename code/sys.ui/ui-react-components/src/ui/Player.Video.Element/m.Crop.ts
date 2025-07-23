import { lens } from './m.Crop.lens.ts';
import { resolveEnd, wrangle } from './m.Crop.u.ts';

/**
 * Helpers for working with the `crop` property:
 */
export const Crop = {
  lens,
  wrangle,
  resolveEnd,
} as const;
