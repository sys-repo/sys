import type { t } from './common.ts';
import type * as TApp from './t.app.ts';
import type * as TPaths from './t.paths.ts';

/**
 * Configuration options for a Vite server.
 * https://vitejs.dev/config
 */
export declare namespace ViteConfig {
  /** Vite configuration helper runtime surface. */
  export type Lib = {
    readonly Is: Is.Lib;

    /**
     * Wrap a Vite config without exposing leaf packages to direct Vite imports.
     */
    define(config: t.ViteUserConfigExport): t.ViteUserConfigExport;

    /**
     * Construct an "application" configuration (index.html).
     */
    app(options?: App.Options): Promise<t.ViteUserConfig>;

    /**
     * Retrieve the workspace module-resolution helpers from a `deno.json` workspace.
     */
    workspace(options?: t.ViteConfigWorkspaceOptions): Promise<t.ViteDenoWorkspace>;

    /**
     * Construct a replacement regex to use an as alias for a module/import
     * lookup within the Vite/Rollup/alias configuration.
     */
    alias(registry: string, moduleName: string): t.ViteAlias;

    /**
     * Produce a set of standard parts for export from a `vite.config.ts` file.
     */
    paths(options?: t.DeepPartial<Paths> | t.StringAbsoluteDir): Paths;

    /**
     * Attempts to dynamically load a `vite.config.ts` module.
     */
    fromFile(configDir?: t.StringDir): Promise<FromFile>;
  };

  /** Flags for major code-registries. */
  export type CodeRegistry = 'jsr' | 'npm';

  /** Driver-managed plugins; defaults are defined per flag. */
  export type CommonPlugins = {
    /** Include the driver's Deno-aware module transport. Default: true. */
    deno?: boolean;

    /** Include the React plugin. Default: true. */
    react?: boolean;

    /** Include the WASM plugin. Default: true. */
    wasm?: boolean;

    /** Include the derived barrel optimize-imports plugin. Default: true. */
    optimizeImports?: boolean;

    /**
     * Add Subresource Integrity to owned JS/CSS linked from built HTML.
     * Does not authenticate HTML or cover the module graph. App builds only; default: true.
     * False disables the managed instance, not a caller-supplied factory.
     */
    htmlIntegrity?: boolean;
  };

  /** Handler for declaring how to chunk a module. */
  export type Chunks = (e: Chunks.Args) => void;

  /** Representation of paths for a Vite configuration. */
  export type Paths = TPaths.Paths;

  /**
   * The result from the `Vite.Config.fromFile` method.
   * See also:
   *    https://vite.dev/guide/api-javascript.html#loadconfigfromfile
   */
  export type FromFile = {
    /** Flag indicating if the config file exists on the filesystem. */
    exists: boolean;

    /** The paths of the Vite configuration. */
    paths?: Paths;

    /** Any error details while loading. */
    error?: t.StdError;
  };

  /**
   * Library of boolean evaluation helpers for Vite configuration data.
   */
  export namespace Is {
    /** Boolean evaluation helper surface. */
    export type Lib = {
      /** Determine if the given input is a paths configuration object. */
      paths(input?: unknown): input is Paths;
    };
  }

  /**
   * Application bundle configuration contracts.
   */
  export namespace App {
    /** Options passed to the `Vite.Config.app` method. */
    export type Options = TApp.Options;
  }

  /**
   * Vite config path contracts.
   */
  export namespace Paths {
    /** Paths for "application" bundles. */
    export type App = TPaths.App;
  }

  /**
   * Manual chunk configuration contracts.
   */
  export namespace Chunks {
    /** Arguments passed to the chunk method. */
    export type Args = {
      /**
       * Place exact module targets in a named chunk.
       * Active workspace aliases resolve roots/subpaths to exact export files, including their
       * realpaths and supported local Deno IDs; they do not select an entire package/directory.
       * Filtered/disabled workspace aliases add no resolved-target matches. Declarations select
       * modules already in the graph, not new imports. Existing exact-ID/node_modules matching
       * remains available. First match follows object-key order; reusing an alias replaces its list.
       *
       * The backend owns dependency placement and may merge shared dependencies across entries.
       * A named chunk is not package-exclusive or a promise of a separate download/lazy boundary:
       * grouping can change loading and side-effect evaluation timing. Verify the emitted graph
       * and runtime behavior for the app, service worker, and module workers.
       */
      chunk(alias: string, moduleName?: string | string[]): Args;
    };
  }
}
