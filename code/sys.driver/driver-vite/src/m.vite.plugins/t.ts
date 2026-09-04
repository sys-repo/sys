import type { t } from './common.ts';

/**
 * Driver-owned Vite plugin surfaces for `@sys/driver-vite`.
 *
 * This module groups focused Vite plugins that are composed centrally by the
 * driver to keep Vite behavior explicit and consistent across adopting apps.
 */
export declare namespace VitePlugins {
  export type Lib = {
    readonly DisposeProtocolCompat: t.DisposeProtocolCompatPlugin.Lib;
    readonly OptimizeImports: t.OptimizeImportsPlugin.Lib;
  };
}

/** Disposal-protocol compatibility delivery plugin. */
export declare namespace DisposeProtocolCompatPlugin {
  /** Runtime surface for constructing the plugin. */
  export type Lib = {
    /** Create a client-only Vite plugin that installs disposal protocol symbols before module bodies. */
    readonly plugin: () => t.VitePlugin;
  };
}
