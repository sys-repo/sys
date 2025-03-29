import { type t } from './common.ts';
import { Breakpoint } from './m.Breakpoint.ts';

/**
 * Main Layout API (logic).
 */
export const Layout = {
  Breakpoint,

  /**
   * Calculate the pixel offset of stacked sheets.
   */
  sheetOffset(index: t.Pixels): t.Pixels {
    const base = 20;
    if (index < 1) return base;
    return base + index * 5;
  },
} as const;
