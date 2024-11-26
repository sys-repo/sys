import type { t } from './common.ts';

/**
 * Helpers
 */
export const Wrangle = {
  rect(input: t.DomRect): t.DomRect {
    return {
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height,
      top: input.top,
      right: input.right,
      bottom: input.bottom,
      left: input.left,
    };
  },

  size(input: t.DomRect): t.Size {
    return {
      width: input.width,
      height: input.height,
    };
  },
} as const;
