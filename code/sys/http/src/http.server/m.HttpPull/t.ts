import { type t } from './common.ts';

/**
 * Pull (HTTP → local FS).
 */
export type HttpPullLib = {
  /** Pure mapping helpers (no IO). */
  readonly Map: HttpPullMapLib;

  /**
   * Download a list of URLs into `dir`.
   * Path mapping uses `Map.urlToPath` with `options.map` rules.
   */
  toDir(
    urls: readonly string[],
    dir: t.StringDir,
    options?: HttpPullOptions,
  ): Promise<t.HttpPullToDirResult>;

  /**
   * Same as `toDir`, but yields progress events.
   * Emission order is not guaranteed to be request order.
   */
  stream(urls: readonly string[], dir: t.StringDir, options?: HttpPullOptions): HttpPullStream;
};

/** Response from `HttpPull.toDir` method */
export type HttpPullToDirResult = {
  readonly ok: boolean;
  readonly ops: readonly t.HttpPullRecord[];
};

/**
 * Result per URL.
 */
export type HttpPullRecord = {
  readonly path: { readonly source: t.StringUrl; readonly target: t.StringPath };
  readonly ok: boolean;
  readonly status?: t.HttpStatusCode;
  readonly bytes?: t.NumberBytes;
  readonly error?: string;
};

/**
 * Pull options.
 */
export type HttpPullOptions = {
  /** Late-bound client. Default: `Http.client()` */
  readonly client?: t.HttpFetch;

  /** URL → path mapping rules used by `Map.urlToPath`. */
  readonly map?: HttpPullMapOptions;

  /** Concurrency limiter. Default: 8 */
  readonly concurrency?: number;

  /** Cancel pull operation. */
  readonly until?: t.UntilInput;
};

/**
 * An API to a stream of downloading URLs.
 * - Async-iterable of progress events (`for await ...`).
 * - `events()` returns an observable that completes on finish/cancel.
 * - `cancel()` aborts in-flight work and completes the stream.
 */
export type HttpPullStream = {
  /** Async-iteration over progress events. */
  readonly [Symbol.asyncIterator]: () => AsyncIterator<t.HttpPullEvent>;

  /** Observable of progress events (completes on finish/cancel). */
  readonly events: (until?: t.UntilInput) => HttpPullStreamEvents;

  /** Abort in-flight requests and complete the stream. */
  readonly cancel: (reason?: unknown) => void;
};

/**
 * Observable events from a pull-stream.
 * (completes on finish/cancel).
 */
export type HttpPullStreamEvents = t.Lifecycle & {
  /** Observable of pull events. */
  readonly $: t.Observable<t.HttpPullEvent>;
};

/**
 * Mapping rules.
 */
export type HttpPullMapOptions = {
  /**
   * Rebase rule: strip this prefix from the URL’s *pathname* (segment-aware),
   * then write whatever remains.
   *
   * Examples:
   *   relativeTo: "/path/sample"
   *   relativeTo: "https://domain.com/path/sample/"
   */
  readonly relativeTo?: string | URL;

  /**
   * If true, prefix the mapped path with the host (eg "domain.com/...").
   * Includes port if present. Default: false.
   */
  readonly includeHost?: boolean;

  /**
   * Escape hatch for total control.
   * If provided, wins over `relativeTo/includeHost`.
   * Must return a POSIX *relative* path (no leading slash).
   */
  readonly mapPath?: (u: URL) => t.StringPath;

  /**
   * When rebasing yields an empty path (eg pathname === relativeTo),
   * use this basename instead (default: "index").
   */
  readonly emptyBasename?: string;
};

/**
 * HTTP-pull progress events.
 */
export type HttpPullEvent =
  | ({ readonly kind: 'start' } & EventCommon)
  | ({ readonly kind: 'progress'; readonly loaded?: number; readonly bytes?: number } & EventCommon)
  | ({ readonly kind: 'done'; readonly record: HttpPullRecord } & EventCommon)
  | ({ readonly kind: 'error'; readonly record: HttpPullRecord } & EventCommon);

type EventCommon = {
  readonly index: t.Index;
  readonly total: number;
  readonly url: t.StringUrl;
};

/**
 * Pure mapping helpers.
 */
export type HttpPullMapLib = {
  /**
   * URL → relative POSIX path, given `HttpPullMapOptions`.
   *
   * Algorithm:
   *   1) Start with URL.pathname
   *   2) `rebase(pathname, baseFrom(relativeTo))`
   *   3) If `includeHost`, prefix with `url.host` (host[:port])
   *   4) If empty → use `emptyBasename` (default "index")
   *
   * Guarantees:
   *   - No leading slash.
   *   - Backslashes converted to "/".
   *   - Never returns empty string.
   */
  urlToPath(u: URL, options?: HttpPullMapOptions): t.StringPath;

  /**
   * Rebase `pathname` by stripping `base` iff it matches on a segment boundary.
   * Returns the remaining relative path (may be empty string).
   *
   * Examples:
   *   rebase("a/b/c", "a/b")  →  "c"
   *   rebase("a/b",   "a/b")  →  ""      (exact match)
   *   rebase("a/bc",  "a/b")  →  "a/bc"  (no-op: not a boundary)
   */
  rebase(pathname: string, base: string | ''): string;

  /**
   * Derive a normalized “base” from `relativeTo`:
   *   - If URL: uses its `.pathname`
   *   - Else: uses the string as-is
   * Then `toRelPosix(...)` for normalization.
   *
   * Returns a string with no leading slash (or "").
   */
  baseFrom(relativeTo?: string | URL): string | '';
};
