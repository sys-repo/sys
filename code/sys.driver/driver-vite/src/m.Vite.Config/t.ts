import type { t } from './common.ts';

export type * from './t.app.ts';
export type * from './t.path.ts';

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
   * Produces a set of standard parts for export from a `vite.config.ts` file.
   * @example
   * ```ts
   * export const paths = Vite.Config.paths(...);
   * ```
   */
  paths(options?: t.DeepPartial<t.ViteConfigPath>): t.ViteConfigPath;
};

/**
 * TODO 🐷 refactor these path object out.
 * - normalize them (where possible)
 * - use the Path if possible.
 */

/** Paths relating to a Vite child process. */
export type ViteConfigPaths = { input: t.StringPath; outDir: t.StringPath };

/** Bundle directories. */
export type ViteBundleDirs = { in: t.StringDir; out: t.StringDir };

/**
 * Common plugins (default: true).
 */
export type ViteConfigCommonPlugins = {
  /** Flag indicating if the "react+swc" plugin should be included. */
  react?: boolean;
  /** Flag indicating if the "wasm" plugin should be included. */
  wasm?: boolean;
};

/**
 * Handler for declaring how to chunk a module.
 */
export type ViteModuleChunks = (e: ViteModuleChunksArgs) => void;
/** Arguments passed to the chunk method. */
export type ViteModuleChunksArgs = {
  /** Define a chunk. */
  chunk(alias: string, moduleName?: string | string[]): ViteModuleChunksArgs;
};
