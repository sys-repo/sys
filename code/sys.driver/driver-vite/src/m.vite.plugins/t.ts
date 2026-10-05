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
    readonly HtmlIntegrity: HtmlIntegrity.Lib;
  };

  /**
   * Subresource Integrity (SRI) for JavaScript and CSS linked from built HTML.
   *
   * Browsers use hashes in trusted HTML to check fetched bytes. Coverage is limited to
   * emitted module scripts, stylesheets, and preloads of the same module URL;
   * imported dependencies are not covered.
   *
   * See the package README's "HTML subresource integrity" section for build and loading limits.
   */
  export namespace HtmlIntegrity {
    /** Opt-in client-build integration; development serving is unchanged. */
    export type Lib = {
      /**
       * Create a plugin that adds SHA-256 integrity and anonymous CORS attributes.
       *
       * Finish JS/CSS/HTML transformations before this plugin generates integrity.
       * Later byte rewriting is unsupported and is not detected.
       */
      plugin(): t.VitePlugin;
    };
  }
}

/** Disposal-protocol compatibility delivery plugin. */
export declare namespace DisposeProtocolCompatPlugin {
  /** Runtime surface for constructing the plugin. */
  export type Lib = {
    /** Create a client-only Vite plugin that installs disposal protocol symbols before module bodies. */
    readonly plugin: () => t.VitePlugin;
  };
}
