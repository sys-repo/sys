import type React from 'react';
import type { t } from './common.ts';

export type * from './t.Signals.ts';
type M = React.MouseEventHandler<HTMLDivElement>;

/**
 * Library: Sheet
 */
export type SheetLib = {
  /** The UI component of the sheet. */
  readonly View: React.FC<SheetProps>;

  /** Library: Sheet Signals (State) */
  readonly Signals: t.SheetSignalsLib;
};

/**
 * The orientation and slide direction of the sheet.
 */
export type SheetOrientation = 'Bottom:Up' | 'Top:Down' | 'Left:Right' | 'Right:Left';

/**
 * <Component>:
 */
export type SheetProps = {
  children?: t.ReactNode;
  radius?: t.Pixels;

  orientation?: t.SheetOrientation;
  duration?: t.Secs;
  bounce?: number;

  margin?: t.SheetEdgeMargin | t.SheetEdgeMargins;
  shadowOpacity?: t.Percent;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onClick?: M;
  onDoubleClick?: M;
  onMouseDown?: M;
  onMouseUp?: M;
  onMouseEnter?: M;
  onMouseLeave?: M;
};

/**
 * Margins for the sheet edges based on orientation.
 */
export type SheetEdgeMargin = t.Pixels;
/** Sheet margin: near/far based on orientation */
export type SheetEdgeMargins = [t.Pixels, t.Pixels];
