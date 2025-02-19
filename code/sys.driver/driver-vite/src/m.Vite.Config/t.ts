import type { t } from './common.ts';

/** Flags for major code-registries. */
export type CodeRegistry = 'jsr' | 'npm';

/**
 * Configuration options for a Vite server.
 * https://vitejs.dev/config
 */
export type ViteConfigLib = {
  /**
   * Construct an "application" configuration (index.html).
   */
  app(options?: t.ViteConfigAppOptions): Promise<t.ViteUserConfig>;

  /** Prepare paths for the vite build. */
  paths(options?: t.ViteConfigPathsOptions): t.ViteConfigPaths;

  /** Retrieve the workspace module-resolution helpers from a `deno.json` workspace. */
  workspace(options?: t.ViteConfigWorkspaceOptions): Promise<t.ViteDenoWorkspace>;

  /**
   * Construct a replacement regex to use an as alias for a module/import lookup
   * within the Vite/Rollup/alias configuration.
   */
  alias(registry: string, moduleName: string): t.ViteAlias;
};

/** Tools for configuring the "output" dir, eg: "./dist" */
export type ViteConfigOutDir = { readonly default: t.StringPath };

/** Paths params inputs. */
export type ViteConfigPathsOptions = { input?: t.StringPath; outDir?: t.StringPath };

/** Paths relating to a Vite child process. */
export type ViteConfigPaths = { input: t.StringPath; outDir: t.StringPath };

/** Bundle directories. */
export type ViteBundleDirs = { in: t.StringDir; out: t.StringDir };

/**
 * Options passed to the `Vite.Config.app` method.
 */
export type ViteConfigAppOptions = {
  /**
   * Project root directory (where index.html is located).
   * Can be an absolute path, or a path relative to the current working directory.
   * See:
   *    https://vite.dev/config/shared-options.html#root
   */
  root?: t.StringDir;

  /**
   * Relative pathing within bundled assets, eg: src="./main..."
   * See:
   *  https://vite.dev/config/shared-options.html#base
   */
  base?: t.StringRelativeDir;

  /**
   * Enabled deno workspace support.
   *
   * - (default: enabled: walks up to find first available workspace `deno.json` file.)
   * - pass a specific `deno.json` file string if in a non-standard place.
   * - pass `false` to disable workspace {alias} mapping.
   */
  workspace?: boolean | t.DenoFilePath;

  /**
   * ƒ(🌳): Filter to apply to the workspace modules
   *       (default: nothing filtered → ie. the entire monorepo is available for `import`).
   */
  filter?: t.WorkspaceFilter;

  /**
   * Chuck a named module into it's own bundle.
   */
  chunks?: t.ViteModuleChunks;

  /**
   * Flag indicating if the output should be minified.
   * Useful for debugging the output.
   * Default: true.
   */
  minify?: boolean;

  /**
   * Common plugins to include (default true).
   */
  plugins?: t.ViteConfigCommonPlugins;
};

/**
 * Common plugins (default: true).
 */
export type ViteConfigCommonPlugins = {
  /** Flag indicating if the "react+swc" plugin should be included. */
  react?: boolean;

  /** Flag indicating if the "wasm" plugin should be included. */
  wasm?: boolean;
};
