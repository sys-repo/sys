import type { t } from './common.ts';

/**
 * HTTP cache contracts.
 */
export declare namespace HttpCache {
  /** Service-worker cache helper library. */
  export type Lib = {
    /** Command helpers for controlling service-worker cache state. */
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
      /** Package descriptor used to derive cache namespaces. */
      pkg: t.Pkg;
      /** Reserved cache-name input; cache keys are currently derived from the package name. */
      cacheName?: string;
      /** Suppress service-worker cache logging. */
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
      /** Active media caching strategy. */
      readonly mode: Mode;
      /** Maximum byte size for a single cached range chunk. */
      readonly maxChunkBytes: number;
      /** Maximum full-object byte size eligible for media caching. */
      readonly maxObjectBytes: number;
      /** Maximum total bytes retained by range-window media cache. */
      readonly maxTotalBytes: number;
      /** Time-to-live for cached media range entries. */
      readonly ttl: t.Msecs;
    };

    /** User-supplied media cache policy input. */
    export type PolicyInput = {
      /** Media caching strategy override. */
      mode?: Mode;
      /** Maximum byte size for a single cached range chunk. */
      maxChunkBytes?: number;
      /** Maximum full-object byte size eligible for media caching. */
      maxObjectBytes?: number;
      /** Maximum total bytes retained by range-window media cache. */
      maxTotalBytes?: number;
      /** Time-to-live for cached media range entries, in milliseconds. */
      ttlMs?: number;
    };
  }
}
