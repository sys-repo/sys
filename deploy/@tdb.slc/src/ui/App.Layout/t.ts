import { type t } from './common.ts';
export type * from './t.Breakpoint.ts';

/**
 * Logical helpers for working with layouts.
 */
export type AppLayoutLib = {
  readonly Breakpoint: t.BreakpointLib;

  /**
   * Calculate the pixel offset of stacked sheets.
   */
  sheetOffset(args: t.AppLayoutSheetOffsetArgs): t.CssMarginArray;
};

export type AppLayoutSheetOffsetArgs = {
  state: t.AppSignals;
  index: number;
  orientation?: t.SheetOrientation;
  base?: t.NumberOffset;
};
