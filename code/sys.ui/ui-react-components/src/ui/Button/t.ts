import type React from 'react';
import type { t } from './common.ts';

type MouseHandler = React.MouseEventHandler;
type Content = JSX.Element | string | number | false;

/**
 * <Component>: Headless clickable "button" component.
 */
export type ButtonProps = {
  debug?: boolean;

  children?: Content;
  label?: string | (() => string);
  enabled?: boolean;
  active?: boolean;
  block?: boolean;
  tooltip?: string;

  isOver?: boolean; // force the button into an "is-over" state.
  isDown?: boolean; // force the button into an "is-down" state.

  theme?: t.CommonTheme;
  style?: t.CssInput;
  margin?: t.CssEdgesInput;
  padding?: t.CssEdgesInput;
  minWidth?: number;
  maxWidth?: number;
  userSelect?: boolean;
  pressedOffset?: [number, number];

  /** Subscribe to signals that cause the button to redraw. */
  subscribe?: () => void;

  onClick?: MouseHandler;
  onMouseDown?: MouseHandler;
  onMouseUp?: MouseHandler;
  onMouseEnter?: MouseHandler;
  onMouseLeave?: MouseHandler;
  onDoubleClick?: MouseHandler;
  onMouse?: t.ButtonMouseHandler;
};

/**
 * Events
 */
export type ButtonMouseHandler = (e: ButtonMouseHandlerArgs) => void;
export type ButtonMouseHandlerArgs = {
  isDown: boolean;
  isOver: boolean;
  isEnabled: boolean;
  action: 'MouseEnter' | 'MouseLeave' | 'MouseDown' | 'MouseUp';
  event: React.MouseEvent;
};

export type ButtonCopyHandler = (e: ButtonCopyHandlerArgs) => void;
export type ButtonCopyHandlerArgs = {
  message(value: Content): ButtonCopyHandlerArgs;
  fontSize(value: number): ButtonCopyHandlerArgs;
  opacity(value: number): ButtonCopyHandlerArgs;
  delay(value: t.Msecs): ButtonCopyHandlerArgs;
  copy(value?: string | number): Promise<void>;
};
