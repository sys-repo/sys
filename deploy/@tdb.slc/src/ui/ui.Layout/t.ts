import type { t } from './common.ts';
export type * from './t.Layout.ts';

/**
 * <Component>: Mobile
 */
export type LayoutMobileProps = {
  signals?: t.AppSignals;
  style?: t.CssInput;
};

/**
 * <Component>: Intermediate
 */
export type LayoutIntermediateProps = {
  signals?: t.AppSignals;
  style?: t.CssInput;
};

/**
 * <Component>: Desktop
 */
export type LayoutDesktopProps = {
  signals?: t.AppSignals;
  style?: t.CssInput;
};
