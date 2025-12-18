import type { t } from './common.ts';
import type { GridProps } from './ui.browser/ui.Grid.tsx';
import type { ToolbarProps } from './ui.browser/ui.Toolbar.tsx';
import type { DistProps } from './ui.tsx';

/** Type re-exports */
export type * from './ui.browser/t.ts';

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
  export type UI = t.FC<Props> & {
    readonly Browser: Browser.UI;
  };

  /**
   * Component: base view.
   */
  export type Props = DistProps;

  export namespace Browser {
    export type UI = t.FC<t.DistBrowserProps> & {
      readonly Grid: t.FC<GridProps>;
      readonly Toolbar: t.FC<ToolbarProps>;
    };

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
