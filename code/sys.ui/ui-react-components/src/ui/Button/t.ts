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
  tooltip?: string;

  // Boolean:
  enabled?: boolean | (() => boolean);
  opacity?: t.Percent | t.ButtonPropCallback<t.Percent>;
  active?: boolean;
  block?: boolean;
  isOver?: boolean; // force the button into an "is-over" state.
  isDown?: boolean; // force the button into an "is-down" state.

  // Appearance:
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

  // Events:
  onClick?: MouseHandler;
  onMouseDown?: MouseHandler;
  onMouseUp?: MouseHandler;
  onMouseEnter?: MouseHandler;
  onMouseLeave?: MouseHandler;
  onDoubleClick?: MouseHandler;
  onMouse?: t.ButtonMouseHandler;
};

/** Callbacks used by a button to dynaically evaluate a value on redraw. */
export type ButtonPropCallback<T> = (e: ButtonPropCallbackArgs) => T;
/** Callback arguments. */
export type ButtonPropCallbackArgs = { readonly is: t.ButtonFlags };

/**
 * Flags representing the state of the button.
 */
export type ButtonFlags = {
  readonly enabled: boolean;
  readonly disabled: boolean;
  readonly over: boolean;
  readonly down: boolean;
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
  readonly is: t.ButtonFlags;
  cancel(): void;
};
