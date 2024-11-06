import type { t } from '../common.ts';

type Color = string | number;

/**
 * Component
 */
export type SwitchProps = {
  value?: boolean;
  width?: number;
  height?: number;
  enabled?: boolean;
  tooltip?: string;
  track?: Partial<t.SwitchTrack>;
  thumb?: Partial<t.SwitchThumb>;
  theme?: t.CommonTheme | Partial<t.SwitchTheme>;
  transitionSpeed?: number;
  style?: t.CssValue;

  onClick?: React.MouseEventHandler;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
};

export type SwitchTheme = {
  trackColor: { on: Color; off: Color; disabled: Color };
  thumbColor: { on: Color; off: Color; disabled: Color };
  shadowColor: Color;
  disabledOpacity: t.Percent;
};

export type SwitchTrack = {
  widthOffset: number;
  heightOffset: number;
  color: { on: Color; off: Color; disabled: Color };
  borderRadius: number;
  borderWidth: { on?: number; off?: number };
};

export type SwitchThumb = {
  width: number;
  height: number;
  xOffset: number;
  yOffset: number;
  borderRadius: number;
  color: { on: Color; off: Color; disabled: Color };
  shadow: t.CssShadow;
};
