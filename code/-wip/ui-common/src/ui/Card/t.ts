import type { t } from './common.ts';

type ElementInput = JSX.Element | null | false;
type Color = string | number;

export type CardBorder = {
  color?: Color;
  radius?: number | string;
};

export type CardBackground = {
  color?: number | string;
  blur?: number;
};

export type CardBackside = {
  flipped?: boolean;
  speed?: t.Msecs;
};

export type CardSizeDimension = number | { fixed?: number; min?: number; max?: number };
export type CardWidth = CardSizeDimension;
export type CardHeight = CardSizeDimension;

export type CardProps = {
  children?: ElementInput;
  header?: ElementInput;
  footer?: ElementInput;

  backside?: ElementInput;
  backsideHeader?: ElementInput;
  backsideFooter?: ElementInput;

  background?: t.CardBackground;
  border?: t.CardBorder;
  showAsCard?: boolean;
  showBackside?: boolean | CardBackside;
  shadow?: boolean | t.CssShadow;

  focused?: boolean;
  focusBorder?: boolean | Color;
  tabIndex?: number; // NB: auto set to 0 if [focused] property or [onFocus/onBlur] handlers are set.

  userSelect?: string | boolean;
  padding?: t.CssEdgesInput;
  margin?: t.CssEdgesInput;
  width?: t.CardWidth;
  height?: t.CardHeight;
  style?: t.CssValue;

  onClick?: React.MouseEventHandler;
  onDoubleClick?: React.MouseEventHandler;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
  onFocusChange?: CardFocusChangeHandler;
};

export type CardFocusChangeHandler = (e: CardFocusChangeHandlerArgs) => void;
export type CardFocusChangeHandlerArgs = { focused: boolean };
