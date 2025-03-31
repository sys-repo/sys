import type { t } from './common.ts';

/**
 * <Component>: Mobile
 */
export type LayoutMobileProps = {
  state?: t.AppSignals;
  style?: t.CssInput;

  // Attributes:
  sheetMargin?: t.Pixels;
};

/**
 * <Component>: Intermediate
 */
export type LayoutIntermediateProps = {
  state?: t.AppSignals;
  style?: t.CssInput;
};

/**
 * <Component>: Desktop
 */
export type LayoutDesktopProps = {
  state?: t.AppSignals;
  style?: t.CssInput;
};
