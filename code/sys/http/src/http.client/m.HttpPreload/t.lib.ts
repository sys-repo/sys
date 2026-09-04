import type { t } from './common.ts';

/**
 * HTTP preload contracts.
 */
export declare namespace HttpPreload {
  /** Small, pure preloader for warming HTTP cache/network only. */
  export type Lib = {
    /** Warm a set of HTTP resources to prime cache ahead of use. */
    warm(input: Input, options: Options): Promise<Result>;
  };

  /** Preload input: list of URLs or structured targets. */
  export type Input = t.StringUrl[] | Target[];

  /** A single preload target. */
  export type Target = {
    /** URL to warm. */
    readonly url: t.StringUrl;
    /**
     * Optional byte-range to warm (inclusive start, optional end).
     * The bounded client must admit this target origin for caller-provided headers.
     */
    readonly range?: ByteRange;
  };

  /** Byte-range for partial warm requests. */
  export type ByteRange = {
    /** Inclusive byte offset where the range starts. */
    readonly start: t.NumberBytes;
    /** Inclusive byte offset where the range ends. */
    readonly end?: t.NumberBytes;
  };

  type OptionsCommon = {
    /** Concurrency limiter (default implementation-defined). */
    readonly concurrency?: number;
  };

  /** Preload transport and execution options. */
  export type Options = OptionsCommon & (OptionsClient | OptionsPolicy);

  type OptionsClient = {
    /** Caller-owned bounded Fetch capability. */
    readonly client: t.HttpFetch.Instance;
    readonly policy?: never;
    readonly until?: never;
  };

  type OptionsPolicy = {
    readonly client?: undefined;
    /** Response policy for the internally owned Fetch capability. */
    readonly policy: t.HttpFetch.ResponsePolicy;
    /** Cancel the internally owned Fetch capability. */
    readonly until?: t.UntilInput;
  };

  /** Result from `warm` method. */
  export type Result = {
    /** True when every warm operation succeeded. */
    readonly ok: boolean;
    /** Per-target warm results in input order. */
    readonly ops: readonly Record[];
  };

  /** Result per target. */
  export type Record = {
    /** URL that was warmed. */
    readonly url: t.StringUrl;
    /** True when the warm request succeeded. */
    readonly ok: boolean;
    /** HTTP status returned by the warm request. */
    readonly status?: t.HttpStatusCode;
    /** Bytes reported by the warm response, when known. */
    readonly bytes?: t.NumberBytes;
    /** Error message when the warm request failed. */
    readonly error?: string;
    /** Byte range used for the warm request. */
    readonly range?: ByteRange;
    /**
     * True when the warm response confirms the safe-full media cache
     * was populated and can serve future byte-range reads locally.
     */
    readonly fullMediaCached?: boolean;
  };
}
