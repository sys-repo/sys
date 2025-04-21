import type { t } from './common.ts';

/** Horizontal alignment options. */
export type CenterColumnAlign = 'Left' | 'Center' | 'Right';

/**
 * <Component>:
 */
export type LayoutCenterColumnProps = {
  debug?: boolean;
  align?: t.CenterColumnAlign;
  centerWidth?: t.Pixels;

  left?: t.ReactNode;
  center?: t.ReactNode;
  right?: t.ReactNode;

  gap?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
