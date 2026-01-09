import type { t } from './common.ts';

/**
 * Small, pure preloader for warming HTTP cache/network only.
 */
export type HttpPreloadLib = {
  /** Preload a set of HTTP resources to warm cache ahead of use. */
  preload(input: HttpPreloadInput, options?: HttpPreloadOptions): Promise<HttpPreloadResult>;
};

/**
 * Preload input: list of URLs or structured targets.
 */
export type HttpPreloadInput = t.StringUrl[] | HttpPreloadTarget[];

/**
 * A single preload target.
 */
export type HttpPreloadTarget = {
  /** URL to warm. */
  readonly url: t.StringUrl;
  /** Optional byte-range to warm (inclusive start, optional end). */
  readonly range?: HttpPreloadByteRange;
};

/**
 * Byte-range for partial warm requests.
 */
export type HttpPreloadByteRange = {
  readonly start: t.NumberBytes;
  readonly end?: t.NumberBytes;
};

/**
 * Preload options.
 */
export type HttpPreloadOptions = {
  /** Late-bound client (defaults to standard fetcher). */
  readonly client?: t.HttpFetch;
  /** Concurrency limiter (default implementation-defined). */
  readonly concurrency?: number;
  /** Cancel preload operation. */
  readonly until?: t.UntilInput;
};

/**
 * Result from `preload` method.
 */
export type HttpPreloadResult = {
  readonly ok: boolean;
  readonly ops: readonly HttpPreloadRecord[];
};

/**
 * Result per target.
 */
export type HttpPreloadRecord = {
  readonly url: t.StringUrl;
  readonly ok: boolean;
  readonly status?: t.HttpStatusCode;
  readonly bytes?: t.NumberBytes;
  readonly error?: string;
  readonly range?: HttpPreloadByteRange;
};
