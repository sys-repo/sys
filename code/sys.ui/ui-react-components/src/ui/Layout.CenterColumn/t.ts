import type { t } from './common.ts';

/** Horizontal alignment options. */
export type CenterColumnAlign = 'Left' | 'Center' | 'Right';

/**
 * <Component>:
 */
export type LayoutCenterColumnProps = {
  align?: t.CenterColumnAlign;
  centerWidth?: t.Pixels;
  gap?: t.Pixels;

  left?: t.ReactNode;
  center?: t.ReactNode;
  right?: t.ReactNode;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
