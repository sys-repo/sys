import type React from 'react';
import type { IconType } from 'react-icons';
import type { t } from '../common.ts';

type MouseHandler = React.MouseEventHandler;

/**
 * Tools for rendering icons.
 */
export type IconLib = {
  /** Factory that produces an icon-renderer for the given Icon definition. */
  renderer(type: IconType): t.IconRenderer;
};

/**
 * An <Icon> component function.
 */
export type IconRenderer = (props: IconProps) => JSX.Element;

/**
 * <Component>: Display properties for an icon.
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
  onClick?: MouseHandler;
  onDoubleClick?: MouseHandler;
  onMouseDown?: MouseHandler;
  onMouseUp?: MouseHandler;
  onMouseEnter?: MouseHandler;
  onMouseLeave?: MouseHandler;
};

/**
 * <Component>: The inner renderer of an icon.
 */
export type IconViewProps = t.IconProps & {
  type: IconType;
  tabIndex?: number;
};
