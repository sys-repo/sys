import type { t } from './common.ts';

/** Flags for major code-registries. */
export type CodeRegistry = 'jsr' | 'npm';

/**
 * Configuration options for a Vite server.
 * https://vitejs.dev/config
 */
export type ViteConfigLib = {
  /** The output directory path (helpers and generators). */
  readonly outDir: t.ViteConfigOutDir;

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

/**
 * Tools for configuring the "output" dir, eg: "./dist"
 */
export type ViteConfigOutDir = { readonly default: t.StringPath };

/** Paths params inputs. */
export type ViteConfigPathsOptions = { input?: t.StringPath; outDir?: t.StringPath };

/**
 * Paths relating to a Vite child process.
 */
export type ViteConfigPaths = { input: t.StringPath; outDir: t.StringPath };

export type ViteBundleDirs = {
  in: t.StringDir;
  out: t.StringDir;
};
