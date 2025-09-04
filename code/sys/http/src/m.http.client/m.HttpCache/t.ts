import type { t } from './common.ts';

/**
 * Tools for working with the browser's HTTP cache within a "service-worker" process.
 */
export type HttpCacheLib = {
  /**
   * Starts the permanent cache for all immutable,
   * hash-named bundle files.
   *
   * Files emitted by Vite look like:
   *   /pkg/m.XOnTrOh4.js
   *   /pkg/a.BnEcDK_c.wasm
   *   /pkg/-entry.DJ2ZDeEQ.js
   *   /pkg/m.2CvxsZQK.css
   *
   * Rule:
   *   • must live under "/pkg/"
   *   • have *any* base name
   *   • a dot-separated "hash" >= 8 chars (letters, digits, "_" or "-")
   *   • a final extension (js, css, wasm, etc.)
   */
  pkg(args: { pkg: t.Pkg; cacheName?: string; silent?: boolean }): Promise<void>;
};
