import type React from 'react';
import type { t } from '../common.ts';

/**
 * An <Icon> component function.
 */
export type IconRenderer = (props: IconProps) => JSX.Element;

/**
 * Display properties for an icon.
 */
export type IconProps = {
  size?: number;
  color?: number | string;
  opacity?: t.Percent;
  tooltip?: string;
  offset?: [number, number]; // x,y  |  (+/-) pixels.
  flipX?: boolean;
  flipY?: boolean;
  margin?: t.CssMarginInput;
  style?: t.CssInput;
  onClick?: React.MouseEventHandler;
  onDoubleClick?: React.MouseEventHandler;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
};
