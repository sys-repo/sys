import { type t } from './common.ts';
import { Breakpoint } from './m.Breakpoint.ts';

type OffsetOptions = {
  base?: t.NumberOffset;
};

/**
 * Main Layout API (logic).
 */
export const Layout = {
  Breakpoint,

  /**
   * Calculate the pixel offset of stacked sheets.
   */
  sheetOffset(index: number, options?: t.NumberOffset | OffsetOptions): t.Pixels {
    const { base = 20 } = wrangle.offsetOptions(options);
    if (index < 1) return base;
    return base + index * 9;
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  offsetOptions(input?: t.NumberOffset | OffsetOptions): OffsetOptions {
    if (typeof input === 'number') return { base: input };
    return input ?? {};
  },
} as const;
