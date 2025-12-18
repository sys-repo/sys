import type { t } from './common.ts';

/** Type re-exports */
export type * from './ui.browser/t.ts';

/**
 * UI components for working with `dist.json` standard structure.
 */
// export type DistLib = {};

/**
 * UI components for working with `dist.json` standard structure.
 */
export namespace Dist {
  export type Lib = {
    readonly UI: UI;
    readonly useBrowserController: (init?: Browser.Controller.Args) => Browser.Controller.Instance;
  };

  /**
   * Compound component: <Dist.UI> with attached sub-components.
   */
  export type UI = t.FC<Dist.Props> & {
    readonly Browser: t.FC<t.DistBrowserProps>;
  };

  /**
   * Component: base view.
   */
  export type Props = {
    dist?: t.DistPkg;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };

  export namespace Browser {
    /**
     * Uncontrolled adapter for <Dist.UI.Browser>.
     * Provides local selection state + a stable onSelect handler.
     */
    export namespace Controller {
      /** The `useBrowserController` hook args. */
      export type Args = {
        readonly selectedPath?: t.StringPath;
        readonly onSelect?: t.DistBrowserSelectHandler;
      };
      /** A `useBrowserController` instance */
      export type Instance = {
        readonly selectedPath?: t.StringPath;
        readonly onSelect: t.DistBrowserSelectHandler;
      };
    }
  }
}
