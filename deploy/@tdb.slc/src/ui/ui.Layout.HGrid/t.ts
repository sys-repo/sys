import type { t } from './common.ts';

/**
 * <Component>:
 */
export type LayoutHGridProps = {
  debug?: boolean;
  column?: t.HGridColumnProps;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Properties for the main/center content column.
 */
export type HGridColumnProps = Partial<HGridColumn> & { children?: t.ReactNode };
export type HGridColumn = {
  align: 'Left' | 'Center' | 'Right';
  marginTop: t.Pixels;
  gap: t.Pixels;
  width: t.Pixels;
};
