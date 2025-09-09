import { type t, Num } from './common.ts';

/**
 * Utilities for IconSwatches sizing math.
 */
export const SwatchUtil = {
  normalize(percent: t.Percent, range: t.MinMaxNumberRange) {
    percent = Num.Percent.clamp(percent);
    const pixels = SwatchUtil.toPixels(percent, range);
    return { percent, pixels } as const;
  },

  /**
   * Given a slider percent (0..1) and a [min,max] range,
   * return the pixel size (rounded).
   */
  toPixels(percent: t.Percent, range: t.MinMaxNumberRange): t.Pixels {
    const p = Num.Percent.clamp(percent);
    return Math.round(Num.Percent.Range.fromPercent(p, range));
  },

  /**
   * Given a pixel size and a [min,max] range,
   * return the normalized slider percent (0..1).
   */
  toPercent(pixels: t.Pixels, range: t.MinMaxNumberRange): t.Percent {
    return Num.Percent.clamp(Num.Percent.Range.toPercent(pixels, range));
  },
} as const;
