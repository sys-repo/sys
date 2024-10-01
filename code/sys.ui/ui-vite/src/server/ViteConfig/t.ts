import type { t } from './common.ts';

/**
 * Configuration options for a Vite server.
 * https://vitejs.dev/config
 */
export type ViteConfigLib = {
  /**
   * The output directory path (helpers and generators).
   */
  readonly outDir: {
    readonly default: t.StringPath;
    readonly test: {
      readonly base: t.StringPath;
      random(uniq?: string): t.StringPath;
    };
  };

  /**
   * Prepare paths for the vite build.
   */
  paths(options?: t.ViteConfigPathsOptions): t.ViteCmdPaths;
};

export type ViteConfigPathsOptions = { input?: t.StringPath; outDir?: t.StringPath };
