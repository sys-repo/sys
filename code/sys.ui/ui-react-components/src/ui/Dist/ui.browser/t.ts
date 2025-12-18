import { type t } from './common.ts';

/**
 * Component: browser view (grid/filter/select + action).
 */
export type DistBrowserProps = {
  dist?: t.DistPkg;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

};
