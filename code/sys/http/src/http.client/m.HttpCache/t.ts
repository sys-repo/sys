import type { t } from './common.ts';

/**
 * Tools for working with the browser's HTTP cache within a "service-worker" process.
 */
export type HttpCacheLib = {
  readonly Cmd: t.HttpCacheCmdLib;

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
  pkg(args: HttpCachePkgArgs): Promise<void>;
};

/** Inputs for `Http.Cache.pkg(...)`. */
export type HttpCachePkgArgs = {
  pkg: t.Pkg;
  cacheName?: string;
  silent?: boolean;
  /** Optional media cache policy (defaults to `safe-full`). */
  media?: HttpCacheMediaPolicyInput;
};

/** Media caching strategy used for ranged video requests. */
export type HttpCacheMediaMode = 'off' | 'safe-full' | 'range-window';

/** Normalized media cache policy used internally by the SW cache runtime. */
export type HttpCacheMediaPolicy = {
  readonly mode: HttpCacheMediaMode;
  readonly maxChunkBytes: number;
  readonly maxObjectBytes: number;
  readonly maxTotalBytes: number;
  readonly ttlMs: number;
};

/** User-supplied media cache policy (partial/optional shape). */
export type HttpCacheMediaPolicyInput = {
  mode?: HttpCacheMediaMode;
  maxChunkBytes?: number;
  maxObjectBytes?: number;
  maxTotalBytes?: number;
  ttlMs?: number;
};
