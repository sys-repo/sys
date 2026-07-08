import type { t } from './common.ts';

type Color = string | number;

/**
 * <Component>:
 */
export type SwitchProps = {
  debug?: boolean;
  value?: boolean;
  width?: t.Pixels;
  height?: t.Pixels;
  enabled?: boolean;
  tooltip?: string;

  // Appearance:
  track?: Partial<t.SwitchTrack>;
  thumb?: Partial<t.SwitchThumb>;
  theme?: t.CommonTheme | Partial<t.SwitchTheme>;
  transitionSpeed?: t.Msecs;
  style?: t.CssValue;

  // Handlers:
  onToggle?: t.SwitchToggleHandler;
  onClick?: React.MouseEventHandler;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
};

/**
 * Events:
 */

/** Handler for semantic switch toggle intent. */
export type SwitchToggleHandler = (e: SwitchToggleHandlerArgs) => void;

/** Toggle payload carrying the current and next switch values. */
export type SwitchToggleHandlerArgs = {
  readonly current: boolean;
  readonly next: boolean;
  readonly synthetic: t.ReactMouseEvent;
};

/**
 * Tools for working with the <Switch> themes.
 */
export type SwitchThemeLib = {
  merge(base: t.SwitchTheme, theme: Partial<t.SwitchTheme>): t.SwitchTheme;
  fromName(theme: t.CommonTheme): t.SwitchThemedColors;
  toShadowCss(shadow: t.CssShadow): string | undefined;
  readonly light: SwitchThemedColors;
  readonly dark: SwitchThemedColors;
};

/** Named switch theme palettes. */
export type SwitchThemedColors = {
  default: t.SwitchTheme;
  blue: t.SwitchTheme;
  green: t.SwitchTheme;
  yellow: t.SwitchTheme;
};

/** Theme: Root */
export type SwitchTheme = {
  trackColor: { on: Color; off: Color; disabled: Color };
  thumbColor: { on: Color; off: Color; disabled: Color };
  shadowColor: Color;
  disabledOpacity: t.Percent;
};

/** Theme: Track */
export type SwitchTrack = {
  widthOffset: number;
  heightOffset: number;
  color: { on: Color; off: Color; disabled: Color };
  borderRadius: number;
  borderWidth: { on?: number; off?: number };
};

/** Theme: Thumb. */
export type SwitchThumb = {
  width: number;
  height: number;
  xOffset: number;
  yOffset: number;
  borderRadius: number;
  color: { on: Color; off: Color; disabled: Color };
  shadow: t.CssShadow;
};
