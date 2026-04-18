import type { t } from './common.ts';

/**
 * Driver-owned Vite plugin surfaces for `@sys/driver-vite`.
 *
 * This module groups focused Vite plugins that are composed centrally by the
 * driver to keep Vite behavior explicit and consistent across adopting apps.
 */
export declare namespace VitePlugins {
  export type Lib = {
    readonly OptimizeImports: t.OptimizeImportsPlugin.Lib;
  };
}
