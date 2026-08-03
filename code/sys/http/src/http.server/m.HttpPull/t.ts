import type { t } from './common.ts';

/**
 * HTTP pull contracts.
 */
export declare namespace HttpPull {
  /** HTTP-to-filesystem materialization API. */
  export type Lib = {
    /** Pure mapping helpers retained for the legacy URL mirror. */
    readonly Map: Map.Lib;

    /** Start one checksum-pinned, bounded Rooted materialization operation. */
    start(options: StartOptions): ResourceOperation.Instance;

    /**
     * Download URLs into `dir`, deriving each target with `Map.urlToPath`.
     * This legacy path may replace files and remains only until its final subtraction commit.
     */
    toDir(
      urls: readonly string[],
      dir: t.StringDir,
      options: Options,
    ): Promise<ToDir.Result>;

    /** Start the legacy URL-array materialization as an observable pull operation. */
    stream(urls: readonly string[], dir: t.StringDir, options: Options): Stream.Instance;
  };

  /** One checksum-pinned resource with an explicit root-relative destination. */
  export type Resource = {
    /** Absolute HTTP(S) source admitted by the response policy. */
    readonly source: t.StringUrl;
    /** Destination submitted to the Rooted capability for admission. */
    readonly target: t.StringRelativePath;
    /**
     * Canonical caller-supplied expected SHA-256. Equality authenticates bytes against this value;
     * artifact authority comes from how the caller obtained it.
     */
    readonly checksum: t.StringHash;
    /** Optional caller-supplied exact byte length authenticated before publication. */
    readonly expectedBytes?: t.NumberBytes;
  };

  /** Finite authority for one checksum-pinned Pull operation. */
  export type ResourcePolicy = {
    /** Canonical per-attempt Fetch authority, including the per-file body bound. */
    readonly response: t.HttpFetch.ResponsePolicy;
    /** Maximum resources accepted in one batch. */
    readonly maxResources: number;
    /** Maximum in-flight resource workers. */
    readonly concurrency: number;
    /**
     * Maximum attempts for each resource, including the first attempt. The declared
     * `maxResources × maxAttempts` accounting envelope must remain a safe integer.
     */
    readonly maxAttempts: number;
    /** Fixed delay between retry attempts; zero yields through the microtask scheduler. */
    readonly retryDelay: t.Msecs;
    /**
     * Elapsed window, measured from the first attempt, in which retry delay and later attempts may
     * continue. The first attempt remains independently bounded by `response.timeout`.
     */
    readonly maxRetryElapsed: t.Msecs;
    /**
     * Aggregate bytes transferred across successful and failed attempts. Validation reserves
     * safe-integer headroom for one final observed stream chunk per concurrent worker so overrun
     * evidence stays exact.
     */
    readonly maxTotalBytes: t.NumberBytes;
    /** Maximum elapsed time for the complete operation. */
    readonly totalTimeout: t.Msecs;
  };

  /** Optional credential construction data snapshotted before admission or transport. */
  export type ResourceCredentials = Readonly<
    Pick<t.HttpFetch.CreateOptions, 'accessToken' | 'headers'>
  >;

  /** Input to `HttpPull.start`. */
  export type StartOptions = {
    readonly resources: readonly Resource[];
    readonly rooted: t.Fs.Rooted.Instance;
    readonly policy: ResourcePolicy;
    readonly credentials?: ResourceCredentials;
    readonly until?: t.UntilInput;
  };

  /** Stable checksum evidence for one checksum-pinned resource. */
  export type ResourceChecksumEvidence = {
    readonly expected: t.StringHash;
    readonly actual?: t.StringHash;
    readonly valid?: boolean;
  };

  /** Stable committed publication evidence. */
  export type ResourcePublicationEvidence = {
    readonly operation: 'publish-file';
    readonly committed: true;
  };

  /** Stable failure classification for checksum-pinned Pull. */
  export type ResourceFailureKind =
    | 'invalid-input'
    | 'invalid-policy'
    | 'invalid-resource'
    | 'source-denied'
    | 'resource-limit'
    | 'file-limit'
    | 'aggregate-limit'
    | 'target-admission'
    | 'request-failure'
    | 'checksum-mismatch'
    | 'size-mismatch'
    | 'retry-limit'
    | 'total-timeout'
    | 'publication-failure'
    | 'cancelled'
    | 'execution-failure';

  /** Identity and bounded transfer evidence shared by checksum-pinned records. */
  type ResourceRecordCommon = {
    /** Stable zero-based input identity. */
    readonly index: t.Index;
    /** Sanitized configured source and admitted root-relative destination. */
    readonly path: {
      readonly source: t.StringUrl;
      readonly target: t.StringRelativePath | '';
    };
    /** Attempts started for this resource. */
    readonly attempts: number;
    /** Bytes transferred across all attempts, including failed attempts. */
    readonly transferredBytes: t.NumberBytes;
    /** Caller checksum and any observed actual checksum. */
    readonly checksum?: ResourceChecksumEvidence;
    /** Optional caller-supplied exact size. */
    readonly expectedBytes?: t.NumberBytes;
    /** Actual body size when one complete transfer was received. */
    readonly actualBytes?: t.NumberBytes;
    /** Sanitized source evidence when a failed body transfer observed it. */
    readonly requestedUrl?: t.StringUrl;
    /** Sanitized terminal source evidence when a failed body transfer observed it. */
    readonly finalUrl?: t.StringUrl;
  };

  /** Terminal result for one checksum-pinned input. */
  export type ResourceRecord = ResourceRecordSuccess | ResourceRecordFailure;

  /** Authenticated and committed checksum-pinned resource. */
  export type ResourceRecordSuccess =
    & Omit<
      ResourceRecordCommon,
      'actualBytes' | 'checksum' | 'finalUrl' | 'requestedUrl'
    >
    & t.HttpFetch.ResponsePolicy.SourceEvidence
    & {
      readonly ok: true;
      readonly status: t.HttpStatusCode;
      readonly bytes: t.NumberBytes;
      readonly actualBytes: t.NumberBytes;
      readonly checksum: t.HttpFetch.ResponseChecksum & { readonly valid: true };
      readonly filesystem: ResourcePublicationEvidence;
      readonly error?: undefined;
      readonly kind?: undefined;
      readonly cancelled?: undefined;
    };

  /** Failed checksum-pinned resource without publication byte evidence. */
  export type ResourceRecordFailure = ResourceRecordError | ResourceRecordCancelled;

  /** Policy, transport, authentication, or filesystem failure. */
  export type ResourceRecordError = ResourceRecordCommon & {
    readonly ok: false;
    readonly kind: Exclude<ResourceFailureKind, 'cancelled'>;
    readonly status?: t.HttpStatusCode;
    readonly bytes?: undefined;
    readonly error: string;
    readonly cancelled?: undefined;
    readonly filesystem?: RootedFailureEvidence;
  };

  /** Caller or lifecycle cancellation before an input reached a committed outcome. */
  export type ResourceRecordCancelled = ResourceRecordCommon & {
    readonly ok: false;
    readonly kind: 'cancelled';
    readonly status: 499;
    readonly bytes?: undefined;
    readonly error: 'Pull operation cancelled';
    readonly cancelled: true;
    readonly filesystem?: undefined;
  };

  /** Aggregate evidence for a checksum-pinned operation. */
  export type ResourceTotals = {
    readonly resources: number;
    readonly attempts: number;
    readonly transferredBytes: t.NumberBytes;
    readonly publishedBytes: t.NumberBytes;
  };

  /** One operation-level first terminal cause. */
  export type ResourceTerminalFailure = {
    readonly kind: ResourceFailureKind;
    readonly status?: t.HttpStatusCode;
    readonly error: string;
    readonly cancelled?: true;
  };

  /** Terminal checksum-pinned operation result. */
  export type ResourceResult = ResourceResultSuccess | ResourceResultFailure;

  /** Every resource authenticated and published successfully. */
  export type ResourceResultSuccess = {
    readonly ok: true;
    readonly ops: readonly ResourceRecordSuccess[];
    readonly totals: ResourceTotals;
    readonly terminal?: undefined;
  };

  /** At least one resource failed or the operation reached a terminal bound/cancellation. */
  export type ResourceResultFailure = {
    readonly ok: false;
    readonly ops: readonly ResourceRecord[];
    readonly totals: ResourceTotals;
    readonly terminal?: ResourceTerminalFailure;
  };

  /** Checksum-pinned Pull operation contracts. */
  export namespace ResourceOperation {
    /** Explicit operation control and observation. */
    export type Instance = {
      /** Create an independently disposable hot, non-replaying event view. */
      readonly events: (until?: t.UntilInput) => Events;
      /** Abort queued/in-flight work without exposing abort-controller authority. */
      readonly cancel: (reason?: unknown) => void;
      /** Resolve only after complete worker quiescence and terminal accounting. */
      readonly done: Promise<ResourceResult>;
    };

    /** Independently disposable event view. */
    export type Events = t.Lifecycle & {
      readonly $: t.Observable<t.HttpPull.ResourceEvent.Any>;
    };
  }

  /** Checksum-pinned operation events. */
  export namespace ResourceEvent {
    export type Any = Start | Progress | Done | Error;

    export type Start = { readonly kind: 'start' } & Common;

    export type Progress = {
      readonly kind: 'progress';
      readonly attempt: number;
      readonly loaded: t.NumberBytes;
      readonly bytes?: t.NumberBytes;
      readonly transferredBytes: t.NumberBytes;
    } & Common;

    export type Done = {
      readonly kind: 'done';
      readonly record: t.HttpPull.ResourceRecordSuccess;
    } & Common;

    export type Error = {
      readonly kind: 'error';
      readonly record: t.HttpPull.ResourceRecordFailure;
    } & Common;

    export type Common = {
      readonly index: t.Index;
      readonly total: number;
      readonly url: t.StringUrl;
    };
  }

  /** Terminal result for one legacy URL input. */
  export type Record = RecordSuccess | RecordFailure;

  /** Identity shared by every legacy terminal record. */
  type RecordCommon = {
    readonly path: { readonly source: t.StringUrl; readonly target: t.StringPath };
  };

  /** Successful legacy Pull record with byte evidence. */
  export type RecordSuccess = RecordCommon & {
    readonly ok: true;
    readonly status: t.HttpStatusCode;
    readonly bytes: t.NumberBytes;
    readonly error?: undefined;
  };

  /** Stable Rooted failure evidence retained by checksum-pinned pulls. */
  export type RootedFailureEvidence = {
    readonly operation: t.Fs.Rooted.Operation;
    readonly kind: t.Fs.Rooted.FailureKind;
    readonly committed: boolean;
  };

  /** Failed legacy Pull record without byte evidence. */
  export type RecordFailure = RecordError | RecordCancelled;

  /** Ordinary legacy HTTP, filesystem, validation, or execution failure. */
  export type RecordError = RecordCommon & {
    readonly ok: false;
    readonly status?: t.HttpStatusCode;
    readonly bytes?: undefined;
    readonly error: string;
    readonly cancelled?: undefined;
    readonly filesystem?: RootedFailureEvidence;
  };

  /** Caller or lifecycle cancellation before a legacy input reached a committed outcome. */
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

  /** Legacy Pull transport and execution options. */
  export type Options = LegacyOptions & (OptionsClient | OptionsPolicy);

  /** Caller-owned legacy transport branch. */
  type OptionsClient = {
    readonly client: t.HttpFetch.Instance;
    readonly policy?: never;
  };

  /** Pull-owned legacy transport branch. */
  type OptionsPolicy = {
    readonly client?: undefined;
    readonly policy: t.HttpFetch.ResponsePolicy;
  };

  /** Aggregate legacy materialization results. */
  export namespace ToDir {
    export type Result = ResultSuccess | ResultFailure;

    export type ResultSuccess = {
      readonly ok: true;
      readonly ops: readonly HttpPull.RecordSuccess[];
    };

    export type ResultFailure = {
      readonly ok: false;
      readonly ops: readonly HttpPull.Record[];
    };
  }

  /** Legacy retry contracts. */
  export namespace Retry {
    export type Options = {
      readonly attempts?: number;
      readonly base?: t.Msecs;
      readonly factor?: number;
      readonly jitter?: boolean;
    };
  }

  /** Legacy Pull operation contracts. */
  export namespace Stream {
    export type Instance = {
      /** Iterate the legacy operation's bounded event queue. */
      readonly [Symbol.asyncIterator]: () => AsyncIterator<t.HttpPull.Event.Any>;
      /** Create a hot, non-replaying observable view. */
      readonly events: (until?: t.UntilInput) => Events;
      /** Abort queued/in-flight work. */
      readonly cancel: (reason?: unknown) => void;
      /** Complete after every started worker has quiesced. */
      readonly done: Promise<ToDir.Result>;
    };

    export type Events = t.Lifecycle & {
      readonly $: t.Observable<t.HttpPull.Event.Any>;
    };
  }

  /** Legacy Pull operation event contracts. */
  export namespace Event {
    export type Any = Start | Progress | Done | Error;

    export type Start = { readonly kind: 'start' } & Common;

    export type Progress = {
      readonly kind: 'progress';
      readonly loaded?: number;
      readonly bytes?: number;
    } & Common;

    export type Done = { readonly kind: 'done'; readonly record: HttpPull.RecordSuccess } & Common;

    export type Error =
      & { readonly kind: 'error'; readonly record: HttpPull.RecordFailure }
      & Common;

    export type Common = {
      readonly index: t.Index;
      readonly total: number;
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
       */
      urlToPath(u: URL, options?: Options): t.StringPath;

      /** Rebase `pathname` by stripping `base` only on a segment boundary. */
      rebase(pathname: string, base: string | ''): string;

      /** Derive a relative POSIX base from a string or URL. */
      baseFrom(relativeTo?: string | URL): string | '';
    };

    /** URL-to-path mapping rules. */
    export type Options = {
      readonly relativeTo?: string | URL;
      readonly includeHost?: boolean;
      readonly mapPath?: (u: URL) => t.StringPath;
      readonly emptyBasename?: string;
    };
  }
}
