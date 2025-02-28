import type { defineConfig } from 'vite';
import type { t } from './common.ts';

export type * from './t.app.ts';
export type * from './t.paths.ts';

/** Flags for major code-registries. */
export type CodeRegistry = 'jsr' | 'npm';

/**
 * Configuration options for a Vite server.
 * https://vitejs.dev/config
 */
export type ViteConfigLib = {
  readonly Is: t.ViteConfigIsLib;

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
   * Produce a set of standard parts for export from a `vite.config.ts` file.
   */
  paths(options?: t.DeepPartial<t.ViteConfigPaths> | t.StringAbsoluteDir): t.ViteConfigPaths;

  /**
   * Attempts to dynamically load a `vite.config.ts` module.
   */
  fromFile(configDir?: t.StringDir): Promise<ViteConfigFromFile>;
};

/**
 * Library of boolean evaluation helpers for Vite configuration data.
 */
export type ViteConfigIsLib = {
  /** Determine if the given input is a paths configuration object. */
  paths(input?: any): input is t.ViteConfigPaths;
};

/** Bundle directories. */
export type ViteBundleIO = { in: t.StringDir; out: t.StringDir };

/**
 * Common plugins (default: true).
 */
export type ViteConfigCommonPlugins = {
  /** Flag indicating if the official `deno-vite` plugin should be included. */
  deno?: boolean;

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

/**
 * The result from the `Vite.Config.fromFile` method.
 */
export type ViteConfigFromFile = {
  exists: boolean;
  paths?: t.ViteConfigPaths;
  error?: t.StdError;
};
