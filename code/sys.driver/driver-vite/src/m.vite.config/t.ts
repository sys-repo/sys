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

  /** Common plugins (default: true). */
  export type CommonPlugins = {
    /** Flag indicating if the official `deno-vite` plugin should be included. */
    deno?: boolean;

    /** Flag indicating if the React plugin should be included. */
    react?: boolean;

    /** Flag indicating if the "wasm" plugin should be included. */
    wasm?: boolean;

    /** Flag indicating if the derived barrel optimize-imports plugin should be included. */
    optimizeImports?: boolean;
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
      /** Define a chunk. */
      chunk(alias: string, moduleName?: string | string[]): Args;
    };
  }
}
