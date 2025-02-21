import type { t } from './common.ts';

export type ViteConfigPaths = {
  readonly cwd: t.StringDir;
  readonly app: t.ViteConfigPathsApp;
  readonly lib: t.ViteConfigPathsLib;
};

/**
 * Paths for "application" bundles.
 */
export type ViteConfigPathsApp = {
  /**
   * The entry path to an HTML file.
   */
  readonly entry: t.StringPath;

  /**
   * The directory the bundle output is targetted at.
   * https://vite.dev/config/build-options.html#build-outdir
   */
  readonly outDir: t.StringDir;

  /**
   * Relative pathing within bundled assets, eg: src="./main..."
   * https://vite.dev/config/shared-options.html#base
   */
  readonly base: t.StringDir;
};

/**
 * Paths for "library mode" bundles.
 * https://vite.dev/guide/build.html#library-mode
 */
export type ViteConfigPathsLib = {};
