import type React from 'react';
import type { t } from './common.ts';

export type * from './t.Signal.Stack.ts';

type M = React.MouseEventHandler<HTMLDivElement>;

/**
 * Library: Sheet
 */
export type SheetLib = {
  /** The UI component of the sheet. */
  readonly View: React.FC<SheetProps>;

  /** Library: Sheet Signals (State) */
  readonly Signals: SheetSignalsLib;
};

/**
 * Library: Sheet Signals (State).
 */
export type SheetSignalsLib = {
  /** Factory: create a new stack API. */
  stack<T>(signal?: t.Signal<T[]>): t.SheetSignalStack<T>;
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

  edgeMargin?: t.SheetEdgeMargin | t.SheetEdgeMargins;
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
