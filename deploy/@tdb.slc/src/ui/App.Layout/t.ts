import { type t } from './common.ts';
export type * from './t.Breakpoint.ts';

export type AppLayoutSheetOffsetOptions = { base?: t.NumberOffset };

/**
 * Logical helpers for working with layouts.
 */
export type AppLayoutLib = {
  readonly Breakpoint: t.BreakpointLib;

  /**
   * Calculate the pixel offset of stacked sheets.
   */
  sheetOffset(index: number, options?: t.NumberOffset | t.AppLayoutSheetOffsetOptions): t.Pixels;
};
