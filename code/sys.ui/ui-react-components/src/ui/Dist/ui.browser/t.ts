import { type t } from './common.ts';

/** Toolbar placement options for the dist browser filter bar. */
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

  /**
   * Filter state is independent of toolbar visibility.
   * - Use `toolbar` only to *render* an input.
   * - Filtering still works when `toolbar` is <undefined>.
   */
  filterText?: string;
  onFilter?: DistBrowserFilterHandler;

  toolbar?: {
    readonly placement?: t.DistBrowserToolbarPlacement; // default 'top'
    readonly filterText?: string;
    readonly onFilter?: DistBrowserFilterHandler;
  };
};

/** A selection event  */
export type DistBrowserSelectHandler = (e: DistBrowserSelect) => void;
/** Selection payload containing the chosen dist file path. */
export type DistBrowserSelect = { readonly path: t.StringPath };

/** Filter handler */
export type DistBrowserFilterHandler = (e: DistBrowserFilter) => void;
/** Filter payload carrying the current filter text. */
export type DistBrowserFilter = { readonly text: string };
