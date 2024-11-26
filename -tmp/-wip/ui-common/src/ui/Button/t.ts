import type { t } from './common.ts';

type MouseHandler = React.MouseEventHandler;
type Content = JSX.Element | string | number | false;
type Color = string;

/**
 * Component
 */
export type ButtonProps = {
  children?: Content;
  label?: string;
  enabled?: boolean;
  active?: boolean;
  block?: boolean;
  tooltip?: string;
  overlay?: Content; // eg. a "copied" message.

  isOver?: boolean; // force the button into an "is-over" state.
  isDown?: boolean; // force the button into an "is-down" state.

  spinning?: boolean;
  spinner?: t.PartialDeep<ButtonSpinner>;

  style?: t.CssValue;
  theme?: t.CommonTheme;
  margin?: t.CssEdgesInput;
  padding?: t.CssEdgesInput;
  minWidth?: number;
  maxWidth?: number;
  disabledOpacity?: number;
  userSelect?: boolean;
  pressedOffset?: [number, number];

  onClick?: MouseHandler;
  onMouseDown?: MouseHandler;
  onMouseUp?: MouseHandler;
  onMouseEnter?: MouseHandler;
  onMouseLeave?: MouseHandler;
  onDoubleClick?: MouseHandler;
  onMouse?: t.ButtonMouseHandler;
};

export type ButtonSpinner = {
  width: number;
  color: { enabled: Color; disabled: Color };
};

export type CopyButtonProps = Omit<t.ButtonProps, 'overlay'> & {
  onCopy?: ButtonCopyHandler;
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
