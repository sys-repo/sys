import { type t } from './common.ts';

export type DistBrowserToolbarPlacement = 'top' | 'bottom';

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

  toolbar?: {
    readonly placement?: t.DistBrowserToolbarPlacement; // default 'top'
    readonly filterText?: string;
    readonly onFilter?: DistBrowserFilterHandler;
  };
};

/** A selection event  */
export type DistBrowserSelectHandler = (e: DistBrowserSelect) => void;
export type DistBrowserSelect = { readonly path: t.StringPath };

/** Filter handler */
export type DistBrowserFilterHandler = (e: DistBrowserFilter) => void;
export type DistBrowserFilter = { readonly text: string };
