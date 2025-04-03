import { type t } from './common.ts';
import { Breakpoint } from './m.Breakpoint.ts';

/**
 * Main Layout API (logic).
 */
export const Layout: t.AppLayoutLib = {
  Breakpoint,

  /**
   * Calculate the pixel offset of stacked sheets.
   */
  sheetOffset(index, options?) {
    const { base = 44 } = wrangle.offsetOptions(options);
    if (index <= 1) return base;
    return base + (index - 1) * 8;
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  offsetOptions(
    input?: t.NumberOffset | t.AppLayoutSheetOffsetOptions,
  ): t.AppLayoutSheetOffsetOptions {
    if (typeof input === 'number') return { base: input };
    return input ?? {};
  },
} as const;
