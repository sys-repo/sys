import { useEffect, useState } from 'react';
import { type t, D } from './common.ts';

export function useScale(size: t.Size, scaleProp?: t.Percent | t.VideoPlayerScale) {
  const { width, height } = size;
  const [calcScale, setCalcScale] = useState<number>();

  /**
   * Effect: calculate scale sizing.
   */
  useEffect(() => {
    if (width === undefined || height === undefined) return;

    const fn = scaleProp;
    if (typeof fn !== 'function') {
      setCalcScale(undefined);
    } else {
      const enlargeBy = (increment: t.Pixels) => wrangle.scale(width, height, increment);
      setCalcScale(fn({ width, height, enlargeBy }));
    }
  }, [width, height, scaleProp]);

  /**
   * API:
   */
  return {
    percent: calcScale ?? scaleProp ?? D.scale,
  } as const;
}

/**
 * Helpers:
 */
const wrangle = {
  scale(width: t.Pixels, height: t.Pixels, increment: t.Pixels) {
    if (width === 0 || height === 0) return 1;
    const scaleX = (width + increment) / width;
    const scaleY = (height + increment) / height;
    return Math.max(scaleX, scaleY); // NB: Return the greater scale factor to ensure both dimensions are increased by at least increment.
  },
} as const;
