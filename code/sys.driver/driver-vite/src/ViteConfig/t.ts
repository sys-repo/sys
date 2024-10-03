import type { t } from './common.ts';

/**
 * Configuration options for a Vite server.
 * https://vitejs.dev/config
 */
export type ViteConfigLib = {
  /* The output directory path (helpers and generators). */
  readonly outDir: t.ViteConfigOutDir;

  /* Prepare paths for the vite build. */
  paths(options?: t.ViteConfigPathsOptions): t.ViteConfigPaths;

  /* Retrieve the workspace module-resolution helpers from a `deno.json` workspace. */
  readonly workspace: t.ViteConfigWorkspaceFactory;
};

/**
 * Retrieve the workspace module-resolution helpers from a `deno.json` workspace.
 */
export type ViteConfigWorkspaceFactory = (
  denofile?: t.StringPath,
  options?: t.ViteConfigWorkspaceOptions,
) => Promise<t.ViteDenoWorkspace>;

/* Options from the {config.workspace} method. */
export type ViteConfigWorkspaceOptions = { walkup?: boolean };

/* Paths params inputs. */
export type ViteConfigPathsOptions = { input?: t.StringPath; outDir?: t.StringPath };

/**
 * Tools for configuring the "output" dir, eg: "./dist"
 */
export type ViteConfigOutDir = {
  readonly default: t.StringPath;
  readonly test: {
    readonly base: t.StringPath;
    random(uniq?: string): t.StringPath;
  };
};

/**
 * Paths relating to a Vite child process.
 */
export type ViteConfigPaths = {
  input: t.StringPath;
  outDir: t.StringPath;
};

/**
 * Vite/Deno workspace helpers.
 */
export type ViteDenoWorkspace = t.DenoWorkspace & {
  /* The module resolution helper information. */
  resolution: t.ViteDenoWorkspaceResolution;
};

/**
 * Module resolution information for a Deno workspace.
 */
export type ViteDenoWorkspaceResolution = {
  /* List of known module-aliases derived from the Deno workspace. */
  readonly aliases: t.ViteAlias[];

  /* Convert the list of aliases into a flat map. */
  toMap(): Record<string, t.StringPath>;
};
