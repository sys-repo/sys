import type { t } from './common.ts';

/** Type re-exports */
export type * from './ui.browser/t.ts';

/**
 * UI components for working with `dist.json` standard structure.
 */
export type DistLib = {
  readonly UI: DistUI;
  /**
   * Uncontrolled adapter for <Dist.UI.Browser>.
   * Provides local selection state + a stable onSelect handler.
   */
  readonly useBrowserController: (init?: DistBrowserControllerArgs) => DistBrowserController;
};

/**
 * Compound component: <Dist.UI> with attached sub-components.
 */
export type DistUI = t.FC<DistProps> & {
  readonly Browser: t.FC<t.DistBrowserProps>;
};

/**
 * Component: base view.
 */
export type DistProps = {
  dist?: t.DistPkg;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/** The `useBrowserController` hook args. */
export type DistBrowserControllerArgs = {
  readonly selectedPath?: t.StringPath;
  readonly onSelect?: t.DistBrowserSelectHandler;
};

/** A `useBrowserController` instance */
export type DistBrowserController = {
  readonly selectedPath?: t.StringPath;
  readonly onSelect: t.DistBrowserSelectHandler;
};
