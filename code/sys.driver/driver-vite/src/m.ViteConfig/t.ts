import type { t } from './common.ts';

type ToStringOptions = { pad?: boolean };

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
  options?: t.ViteConfigWorkspaceOptions,
) => Promise<t.ViteDenoWorkspace>;

/* Options from the {config.workspace} method. */
export type ViteConfigWorkspaceOptions = {
  denofile?: t.StringPath;
  walkup?: boolean;
  filter?: t.WorkspaceFilter;
};

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
  /* List of known module-aliases derived from the Deno workspace. */
  readonly aliases: t.ViteAlias[];

  /**
   * Module filter used by the workspace (default: always returns true, not blocking).
   */
  readonly filter?: t.WorkspaceFilter;

  /* Convert the list of aliases into a flat map. */
  toAliasMap(): Record<string, t.StringPath>;

  /* Pretty string representation of the workspace. */
  toString(options?: ToStringOptions): string;

  /* Pass a toString() on the workspace directly into the log. */
  log(options?: ToStringOptions): void;
};

/**
 * Filter a workspace of modules.
 */
export type WorkspaceFilter = (e: t.WorkspaceFilterArgs) => boolean;
export type WorkspaceFilterArgs = {
  pkg: string;
  export: string;
  subpath: string;
};
