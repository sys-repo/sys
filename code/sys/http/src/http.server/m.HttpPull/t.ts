import type { t } from './common.ts';

/**
 * HTTP pull contracts.
 */
export declare namespace HttpPull {
  /** HTTP-to-filesystem materialization API. */
  export type Lib = {
    /** Pure mapping helpers (no IO). */
    readonly Map: Map.Lib;

    /**
     * Materialize checksum-bound resources through one Rooted capability.
     * The complete batch is validated and admitted before transport; each file is authenticated
     * before no-clobber publication.
     */
    toDir(
      resources: readonly Resource[],
      rooted: t.Fs.Rooted.Instance,
      options: ResourceOptions,
    ): Promise<ToDir.Result>;

    /**
     * Download URLs into `dir`, deriving each target with `Map.urlToPath`.
     * This legacy overload writes directly to derived filesystem paths and may replace files.
     */
    toDir(
      urls: readonly string[],
      dir: t.StringDir,
      options: Options,
    ): Promise<ToDir.Result>;

    /** Start the checksum-bound materialization as an observable pull operation. */
    stream(
      resources: readonly Resource[],
      rooted: t.Fs.Rooted.Instance,
      options: ResourceOptions,
    ): Stream.Instance;

    /** Start the legacy directory materialization as an observable pull operation. */
    stream(urls: readonly string[], dir: t.StringDir, options: Options): Stream.Instance;
  };

  /** One checksum-bound resource with an explicit root-relative destination. */
  export type Resource = {
    /** Absolute HTTP(S) source admitted by the response policy. */
    readonly source: t.StringUrl;
    /** Destination submitted to the Rooted capability for admission. */
    readonly target: t.StringRelativePath;
    /** Canonical expected content hash. */
    readonly checksum: t.StringHash;
    /** Optional exact byte length authenticated before publication. */
    readonly expectedBytes?: t.NumberBytes;
  };

  /**
   * Secure resource options.
   * Pull constructs and owns the bounded transport from `policy`; client injection, mapping,
   * concurrency, and retries are deliberately unavailable on this overload.
   */
  export type ResourceOptions =
    & {
      readonly until?: t.UntilInput;
      readonly concurrency?: never;
      readonly retry?: never;
      readonly map?: never;
    }
    & OptionsPolicy;

  /** Terminal result for one input. */
  export type Record = RecordSuccess | RecordFailure;

  /** Identity shared by every terminal record. */
  type RecordCommon = {
    /**
     * Stable input identity and effective destination.
     * Secure targets are admitted root-relative paths; legacy targets are directory-derived paths.
     */
    readonly path: { readonly source: t.StringUrl; readonly target: t.StringPath };
  };

  /** Successful pull record with byte evidence. */
  export type RecordSuccess = RecordCommon & {
    readonly ok: true;
    readonly status: t.HttpStatusCode;
    readonly bytes: t.NumberBytes;
    readonly error?: undefined;
  };

  /**
   * Stable Rooted failure evidence retained by secure pulls.
   * Capability messages and raw causes are intentionally omitted.
   */
  export type RootedFailureEvidence = {
    readonly operation: t.Fs.Rooted.Operation;
    readonly kind: t.Fs.Rooted.FailureKind;
    /** Whether publication crossed the capability's commit boundary. */
    readonly committed: boolean;
  };

  /** Failed pull record without byte evidence. */
  export type RecordFailure = RecordError | RecordCancelled;

  /** Ordinary HTTP, filesystem, validation, or execution failure. */
  export type RecordError = RecordCommon & {
    readonly ok: false;
    readonly status?: t.HttpStatusCode;
    readonly bytes?: undefined;
    readonly error: string;
    readonly cancelled?: undefined;
    readonly filesystem?: RootedFailureEvidence;
  };

  /** Caller or lifecycle cancellation before an input reached a committed outcome. */
  export type RecordCancelled = RecordCommon & {
    readonly ok: false;
    readonly status: 499;
    readonly bytes?: undefined;
    readonly error: 'Pull operation cancelled';
    readonly cancelled: true;
    readonly filesystem?: undefined;
  };

  /** Shared controls for legacy pull execution. */
  type ExecutionOptions = {
    /** Maximum concurrent legacy pulls. Default: 8. */
    readonly concurrency?: number;
    /** Lifecycle authority for cancelling the operation. */
    readonly until?: t.UntilInput;
    /** Legacy retry policy. `false` disables retries; omitted or `true` uses defaults. */
    readonly retry?: Retry.Options | boolean;
  };

  /** Legacy path mapping and execution controls. */
  type LegacyOptions = ExecutionOptions & {
    /** URL → path mapping rules used by `Map.urlToPath`. */
    readonly map?: Map.Options;
  };

  /** Pull transport and execution options. */
  export type Options = LegacyOptions & (OptionsClient | OptionsPolicy);

  /** Caller-owned transport branch. */
  type OptionsClient = {
    /** Caller-owned bounded Fetch capability; Pull never disposes it. */
    readonly client: t.HttpFetch.Instance;
    readonly policy?: never;
  };

  /** Pull-owned transport branch. */
  type OptionsPolicy = {
    readonly client?: undefined;
    /** Policy for a Fetch capability created and disposed by this pull operation. */
    readonly policy: t.HttpFetch.ResponsePolicy;
  };

  /** Aggregate materialization results. */
  export namespace ToDir {
    /** Response from `HttpPull.toDir`. */
    export type Result = ResultSuccess | ResultFailure;

    /** Every input completed successfully; `ops` remains in input order. */
    export type ResultSuccess = {
      readonly ok: true;
      readonly ops: readonly HttpPull.RecordSuccess[];
    };

    /**
     * At least one input failed or was cancelled.
     * Pull is non-transactional: successful earlier publications remain successful records.
     */
    export type ResultFailure = {
      readonly ok: false;
      readonly ops: readonly HttpPull.Record[];
    };
  }

  /** Legacy retry contracts. */
  export namespace Retry {
    /** Legacy retry options. */
    export type Options = {
      /** Maximum total attempts. Default: 3. */
      readonly attempts?: number;
      /** Initial delay between attempts. Default: 50ms. */
      readonly base?: t.Msecs;
      /** Exponential delay multiplier. Default: 2. */
      readonly factor?: number;
      /** Add up to 30% random delay. Default: true. */
      readonly jitter?: boolean;
    };
  }

  /** HTTP pull operation contracts. */
  export namespace Stream {
    /**
     * One pull operation, exposing event views and canonical terminal truth.
     *
     * Event emission follows execution order, not input order. The async iterator retains a bounded
     * queue and may omit events under pressure; `done` is the complete source of terminal records.
     */
    export type Instance = {
      /**
       * Iterate the operation's single-consumer bounded event queue.
       * Returning early cancels queued and in-flight work.
       */
      readonly [Symbol.asyncIterator]: () => AsyncIterator<t.HttpPull.Event.Any>;

      /**
       * Create a hot, non-replaying observable view.
       * Disposing a view completes only that view; it does not cancel the pull or sibling views.
       */
      readonly events: (until?: t.UntilInput) => Events;

      /** Abort queued/in-flight work and complete after terminal cancellation accounting. */
      readonly cancel: (reason?: unknown) => void;

      /**
       * Complete terminal result after every started worker has quiesced.
       * `ops` contains exactly one input-ordered record per URL/resource.
       */
      readonly done: Promise<ToDir.Result>;
    };

    /** Independently disposable observable view of a pull operation. */
    export type Events = t.Lifecycle & {
      /** Hot, non-replaying operation events. */
      readonly $: t.Observable<t.HttpPull.Event.Any>;
    };
  }

  /** HTTP pull operation event contracts. */
  export namespace Event {
    /** Event emitted while a pull operation executes. */
    export type Any = Start | Progress | Done | Error;

    /** Pull-start event. */
    export type Start = { readonly kind: 'start' } & Common;

    /** Byte-progress event when transport progress evidence is available. */
    export type Progress = {
      readonly kind: 'progress';
      /** Bytes observed so far. */
      readonly loaded?: number;
      /** Expected total bytes, when known. */
      readonly bytes?: number;
    } & Common;

    /** Successful pull-completion event. */
    export type Done = { readonly kind: 'done'; readonly record: HttpPull.RecordSuccess } & Common;

    /** Failed pull-completion event. */
    export type Error =
      & { readonly kind: 'error'; readonly record: HttpPull.RecordFailure }
      & Common;

    /** Stable input identity carried by every operation event. */
    export type Common = {
      /** Zero-based input index. */
      readonly index: t.Index;
      /** Total inputs in the operation. */
      readonly total: number;
      /** Original source URL. */
      readonly url: t.StringUrl;
    };
  }

  /** URL mapping contracts. */
  export namespace Map {
    /** Pure mapping helper library. */
    export type Lib = {
      /**
       * URL → relative POSIX path, given `HttpPull.Map.Options`.
       *
       * Algorithm:
       *   1) If `mapPath` exists, normalize and return its result
       *   2) Start with `URL.pathname`
       *   3) `rebase(pathname, baseFrom(relativeTo))`
       *   4) If `includeHost`, prefix with `URL.host` (host[:port])
       *   5) If empty, use `emptyBasename` (default: "index")
       *
       * With valid options, output has no leading slash, uses POSIX separators, and is non-empty.
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
       * Derive a relative POSIX base from `relativeTo`.
       * URL inputs contribute their pathname; strings are normalized as paths.
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
       *   relativeTo: new URL("https://domain.com/path/sample/")
       */
      readonly relativeTo?: string | URL;

      /**
       * If true, prefix the mapped path with the host (eg "domain.com/...").
       * Includes port if present. Default: false.
       */
      readonly includeHost?: boolean;

      /**
       * Custom URL-to-path mapping; wins over `relativeTo` and `includeHost`.
       * The returned value is normalized to a relative POSIX path.
       */
      readonly mapPath?: (u: URL) => t.StringPath;

      /**
       * Non-empty relative filename used when rebasing removes the whole path.
       * Default: "index".
       */
      readonly emptyBasename?: string;
    };
  }
}
