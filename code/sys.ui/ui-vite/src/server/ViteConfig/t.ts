import type { t } from './common.ts';

/**
 * Configuration options for a Vite server.
 * https://vitejs.dev/config
 */
export type ViteConfigLib = {
  /**
   * The output directory path (helpers and generators).
   */
  readonly outDir: t.ViteConfigOutDir;

  /**
   * Prepare paths for the vite build.
   */
  paths(options?: t.ViteConfigPathsOptions): t.ViteCmdPaths;

  /**
   * Render a `deno.json` workspace into an <Info> object.
   */
  workspace(denofile?: t.StringPath | t.DenofileJson): Promise<t.DenoWorkspace>;
};

/* Param inputs */
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
