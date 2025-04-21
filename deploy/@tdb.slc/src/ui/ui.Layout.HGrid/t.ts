import type { t } from './common.ts';

/**
 * <Component>:
 */
export type LayoutHGridProps = {
  debug?: boolean;
  center?: t.HGridCenterProps;
  left?: t.ReactNode;
  right?: t.ReactNode;
  gap?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Properties for the main/center content column.
 */
export type HGridCenterProps = Partial<HGridColumn> & { children?: t.ReactNode };
export type HGridColumn = {
  align: t.HGridAlign;
  width: t.Pixels;
};

/** Horizontal alignment options. */
export type HGridAlign = 'Left' | 'Center' | 'Right';
