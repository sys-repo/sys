import type { t } from './common.ts';

/**
 * HTTP cache contracts.
 */
export declare namespace HttpCache {
  /** Service-worker cache helper library. */
  export type Lib = {
    readonly Cmd: t.HttpCacheCmd.Lib;

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
    pkg(args: Pkg.Args): Promise<void>;
  };

  /**
   * Package cache contracts.
   */
  export namespace Pkg {
    /** Inputs for `Http.Cache.pkg(...)`. */
    export type Args = {
      pkg: t.Pkg;
      cacheName?: string;
      silent?: boolean;
      /** Optional media cache policy (defaults to `safe-full`). */
      media?: Media.PolicyInput;
    };
  }

  /**
   * Media cache policy contracts.
   */
  export namespace Media {
    /** Media caching strategy used for ranged video requests. */
    export type Mode = 'off' | 'safe-full' | 'range-window';

    /** Normalized media cache policy used internally by the SW cache runtime. */
    export type Policy = {
      readonly mode: Mode;
      readonly maxChunkBytes: number;
      readonly maxObjectBytes: number;
      readonly maxTotalBytes: number;
      readonly ttlMs: t.Msecs;
    };

    /** User-supplied media cache policy input. */
    export type PolicyInput = {
      mode?: Mode;
      maxChunkBytes?: number;
      maxObjectBytes?: number;
      maxTotalBytes?: number;
      ttlMs?: number;
    };
  }
}
