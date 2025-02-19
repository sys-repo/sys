import type { t } from './common.ts';

export type ViteConfigPath = {
  readonly app: t.ViteConfigPathApp;
  readonly lib: t.ViteConfigPathLib;
};

/**
 * Paths for "application" bundles.
 */
export type ViteConfigPathApp = {
  readonly input: t.StringPath;
  readonly outDir: t.StringPath;
};

/**
 * Paths for "library mode" bundles.
 * https://vite.dev/guide/build.html#library-mode
 */
export type ViteConfigPathLib = {};
