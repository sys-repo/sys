import type { t } from './common.ts';

/**
 * HTTP pull contracts.
 */
export declare namespace HttpPull {
  /** HTTP pull helper library. */
  export type Lib = {
    /** Pure mapping helpers (no IO). */
    readonly Map: Map.Lib;

    /** Download checksum-bound resources through one Rooted destination capability. */
    toDir(
      resources: readonly Resource[],
      rooted: t.Fs.Rooted.Instance,
      options: ResourceOptions,
    ): Promise<ToDir.Result>;

    /**
     * Download a list of URLs into `dir`.
     * Path mapping uses `Map.urlToPath` with `options.map` rules.
     */
    toDir(
      urls: readonly string[],
      dir: t.StringDir,
      options: Options,
    ): Promise<ToDir.Result>;

    /** Stream checksum-bound resources through one Rooted destination capability. */
    stream(
      resources: readonly Resource[],
      rooted: t.Fs.Rooted.Instance,
      options: ResourceOptions,
    ): Stream.Instance;

    /**
     * Same as `toDir`, but yields progress events.
     * Emission order is not guaranteed to be request order.
     */
    stream(urls: readonly string[], dir: t.StringDir, options: Options): Stream.Instance;
  };

  /** One checksum-bound resource with an explicit root-relative destination. */
  export type Resource = {
    readonly source: t.StringUrl;
    readonly target: t.StringRelativePath;
    readonly checksum: t.StringHash;
    readonly expectedBytes?: t.NumberBytes;
  };

  /**
   * Secure resource options require owned bounded transport.
   * Scheduling and retry authority belong to later bounded execution policy.
   */
  export type ResourceOptions =
    & {
      readonly until?: t.UntilInput;
      readonly concurrency?: never;
      readonly retry?: never;
      readonly map?: never;
    }
    & OptionsPolicy;

  /** Result per URL. */
  export type Record = RecordSuccess | RecordFailure;

  type RecordCommon = {
    readonly path: { readonly source: t.StringUrl; readonly target: t.StringPath };
  };

  /** Successful pull record with byte evidence. */
  export type RecordSuccess = RecordCommon & {
    readonly ok: true;
    readonly status: t.HttpStatusCode;
    readonly bytes: t.NumberBytes;
    readonly error?: undefined;
  };

  /** Sanitized Rooted failure evidence retained by secure resource pulls. */
  export type RootedFailureEvidence = {
    readonly operation: t.Fs.Rooted.Operation;
    readonly kind: t.Fs.Rooted.FailureKind;
    readonly committed: boolean;
  };

  /** Failed pull record without byte evidence. */
  export type RecordFailure = RecordCommon & {
    readonly ok: false;
    readonly status?: t.HttpStatusCode;
    readonly bytes?: undefined;
    readonly error: string;
    readonly filesystem?: RootedFailureEvidence;
  };

  type ExecutionOptions = {
    /** Concurrency limiter. Default: 8 */
    readonly concurrency?: number;
    /** Cancel pull operation. */
    readonly until?: t.UntilInput;
    /** Retry options. */
    readonly retry?: Retry.Options | boolean;
  };

  type LegacyOptions = ExecutionOptions & {
    /** URL → path mapping rules used by `Map.urlToPath`. */
    readonly map?: Map.Options;
  };

  /** Pull transport and execution options. */
  export type Options = LegacyOptions & (OptionsClient | OptionsPolicy);

  type OptionsClient = {
    /** Caller-owned bounded Fetch capability. */
    readonly client: t.HttpFetch.Instance;
    readonly policy?: never;
  };

  type OptionsPolicy = {
    readonly client?: undefined;
    /** Response policy for the internally owned Fetch capability. */
    readonly policy: t.HttpFetch.ResponsePolicy;
  };

  /**
   * HTTP pull-to-directory contracts.
   */
  export namespace ToDir {
    /** Response from `HttpPull.toDir`. */
    export type Result = ResultSuccess | ResultFailure;

    /** Successful aggregate pull result. */
    export type ResultSuccess = {
      readonly ok: true;
      readonly ops: readonly HttpPull.RecordSuccess[];
    };

    /** Failed aggregate pull result. */
    export type ResultFailure = {
      readonly ok: false;
      readonly ops: readonly HttpPull.Record[];
    };
  }

  /**
   * HTTP pull retry contracts.
   */
  export namespace Retry {
    /** Retry options. */
    export type Options = {
      readonly attempts?: number;
      readonly base?: t.Msecs;
      readonly factor?: number;
      readonly jitter?: boolean;
    };
  }

  /**
   * HTTP pull stream contracts.
   */
  export namespace Stream {
    /**
     * API to a pull-stream of HTTP downloads.
     *
     * Features:
     * - Async iterable of progress events (`for await ... of stream`).
     * - `events()` exposes an observable that completes on finish or cancel.
     * - `done` resolves with the aggregated `HttpPull.ToDir.Result`.
     * - `cancel()` aborts in-flight work and completes the stream.
     */
    export type Instance = {
      /** Async iteration over progress events. */
      readonly [Symbol.asyncIterator]: () => AsyncIterator<t.HttpPull.Event.Any>;

      /**
       * Observable view of progress events.
       * Completes when the stream finishes or is cancelled.
       */
      readonly events: (until?: t.UntilInput) => Events;

      /**
       * Abort in-flight requests, stop emitting events,
       * and complete the stream.
       */
      readonly cancel: (reason?: unknown) => void;

      /**
       * Aggregated result of the pull.
       *
       * Resolves when the stream finishes or is cancelled.
       * - `ok` is `true` only if all completed records succeeded.
       * - `ops` contains one `HttpPull.Record` per attempted URL.
       */
      readonly done: Promise<ToDir.Result>;
    };

    /** Observable events from a pull-stream. */
    export type Events = t.Lifecycle & {
      /** Observable of pull events. */
      readonly $: t.Observable<t.HttpPull.Event.Any>;
    };
  }

  /**
   * HTTP pull progress event contracts.
   */
  export namespace Event {
    /** HTTP-pull progress event. */
    export type Any = Start | Progress | Done | Error;

    /** Pull-start event. */
    export type Start = { readonly kind: 'start' } & Common;

    /** Pull-progress event. */
    export type Progress = {
      readonly kind: 'progress';
      readonly loaded?: number;
      readonly bytes?: number;
    } & Common;

    /** Successful pull-completion event. */
    export type Done = { readonly kind: 'done'; readonly record: HttpPull.RecordSuccess } & Common;

    /** Failed pull-completion event. */
    export type Error =
      & { readonly kind: 'error'; readonly record: HttpPull.RecordFailure }
      & Common;

    /** Common HTTP-pull event fields. */
    export type Common = {
      readonly index: t.Index;
      readonly total: number;
      readonly url: t.StringUrl;
    };
  }

  /**
   * HTTP pull mapping contracts.
   */
  export namespace Map {
    /** Pure mapping helper library. */
    export type Lib = {
      /**
       * URL → relative POSIX path, given `HttpPull.Map.Options`.
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
      urlToPath(u: URL, options?: Options): t.StringPath;

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
       * Derive a normalized "base" from `relativeTo`:
       *   - If URL: uses its `.pathname`
       *   - Else: uses the string as-is
       * Then `toRelPosix(...)` for normalization.
       *
       * Returns a string with no leading slash (or "").
       */
      baseFrom(relativeTo?: string | URL): string | '';
    };

    /** URL-to-path mapping rules. */
    export type Options = {
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
  }
}
