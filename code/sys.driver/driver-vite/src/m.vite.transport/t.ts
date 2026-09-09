import type { t } from './common.ts';

/**
 * Deno-aware transport adapter for Vite module resolution and loading.
 *
 * Owns the runtime bridge for `jsr:`, `npm:`, URL-like specifiers, and
 * other Deno-native module identities inside the Vite/Rollup pipeline.
 */
export namespace ViteTransport {
  export type Lib = {
    /** Produce the Vite plugin for Deno-native module transport. */
    readonly denoPlugin: (options?: DenoPluginOptions) => t.VitePluginOption;
  };

  /** Options for the Deno-native Vite transport plugin. */
  export type DenoPluginOptions = {
    /** Exact `deno.json` / `deno.jsonc` authority for the Deno loader. */
    readonly configPath?: t.StringPath;

    /** Loader-config discovery mode when no explicit `configPath` is provided. */
    readonly configDiscovery?: DenoPluginConfigDiscovery;
  };

  /** Loader-config discovery mode for direct transport usage. */
  export type DenoPluginConfigDiscovery = 'workspace' | 'local';
}
