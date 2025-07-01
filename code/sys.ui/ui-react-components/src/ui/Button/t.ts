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
 * Callbacks used by a button to dynaically evaluate a value on redraw.
 */
export type ButtonPropCallbackHandler<T> = (e: ButtonPropCallbackArgs) => T;
export type ButtonPropCallbackArgs = {
  is: { over: boolean; down: boolean };
};

/**
 * Events:
 */

/** Handler for general mouse button event rollup. */
export type ButtonMouseHandler = (e: ButtonMouseHandlerArgs) => void;
/** Mouse button event rollup. */
export type ButtonMouseHandlerArgs = {
  readonly action: 'MouseEnter' | 'MouseLeave' | 'MouseDown' | 'MouseUp';
  readonly synthetic: React.MouseEvent;
  readonly modifiers: t.KeyboardModifierFlags;
  readonly is: {
    readonly enabled: boolean;
    readonly down: boolean;
    readonly over: boolean;
  };
  cancel(): void;
};
