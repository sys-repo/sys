import type { t } from './common.ts';

/**
 * HTTP preload contracts.
 */
export declare namespace HttpPreload {
  /** Small, pure preloader for warming HTTP cache/network only. */
  export type Lib = {
    /** Warm a set of HTTP resources to prime cache ahead of use. */
    warm(input: Input, options?: Options): Promise<Result>;
  };

  /** Preload input: list of URLs or structured targets. */
  export type Input = t.StringUrl[] | Target[];

  /** A single preload target. */
  export type Target = {
    /** URL to warm. */
    readonly url: t.StringUrl;
    /** Optional byte-range to warm (inclusive start, optional end). */
    readonly range?: ByteRange;
  };

  /** Byte-range for partial warm requests. */
  export type ByteRange = {
    readonly start: t.NumberBytes;
    readonly end?: t.NumberBytes;
  };

  /** Preload options. */
  export type Options = {
    /** Late-bound client (defaults to standard fetcher). */
    readonly client?: t.HttpFetch.Instance;
    /** Concurrency limiter (default implementation-defined). */
    readonly concurrency?: number;
    /** Cancel warm operation. */
    readonly until?: t.UntilInput;
  };

  /** Result from `warm` method. */
  export type Result = {
    readonly ok: boolean;
    readonly ops: readonly Record[];
  };

  /** Result per target. */
  export type Record = {
    readonly url: t.StringUrl;
    readonly ok: boolean;
    readonly status?: t.HttpStatusCode;
    readonly bytes?: t.NumberBytes;
    readonly error?: string;
    readonly range?: ByteRange;
    /**
     * True when the warm response confirms the safe-full media cache
     * was populated and can serve future byte-range reads locally.
     */
    readonly fullMediaCached?: boolean;
  };
}
