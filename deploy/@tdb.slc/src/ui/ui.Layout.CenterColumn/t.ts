import type { t } from './common.ts';

/** Horizontal alignment options. */
export type CenterColumnAlign = 'Left' | 'Center' | 'Right';

/**
 * <Component>:
 */
export type LayoutCenterColumnProps = {
  debug?: boolean;
  center?: t.CenterColumnProps;
  left?: t.ReactNode;
  right?: t.ReactNode;
  gap?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Properties for the main/center content column.
 */
export type CenterColumnProps = Partial<CenterColumn> & { children?: t.ReactNode };
export type CenterColumn = {
  align: t.CenterColumnAlign;
  width: t.Pixels;
};
