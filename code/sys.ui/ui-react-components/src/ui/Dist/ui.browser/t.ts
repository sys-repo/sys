import { type t } from './common.ts';

/**
 * Component: browser view (grid/filter/select + action).
 */
export type DistBrowserProps = {
  dist?: t.DistPkg;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  selectedPath?: t.StringPath;
  onSelect?: t.DistBrowserSelectHandler;
};

/** A selection event  */
export type DistBrowserSelectHandler = (e: DistBrowserSelect) => void;
export type DistBrowserSelect = { readonly path: t.StringPath };
