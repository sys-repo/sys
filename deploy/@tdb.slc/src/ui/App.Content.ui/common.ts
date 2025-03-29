import { type t } from '../common.ts';

export { AppContent } from '../App.Content/mod.ts';
export { VIDEO } from '../App.Content/VIDEOS.ts';

export { CanvasMini } from '../ui.Canvas.Mini/mod.ts';
export { Layout } from '../ui.Layout/mod.ts';
export { Logo } from '../ui.Logo/mod.ts';
export { Sheet as BaseSheet } from '../ui.Sheet/mod.ts';

export * from '../common.ts';

/**
 * Constants
 */

const sheetTheme: t.CommonTheme = 'Light';

export const DEFAULTS = {
  sheetTheme,
  baseSheetOffset: 40,
};
