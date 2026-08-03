import type { t } from './common.ts';

/**
 * Contracts for bounded checksum-pinned HTTP-to-filesystem materialization.
 */
export declare namespace HttpPull {
  /**
   * Checksum-pinned HTTP-to-filesystem materialization API.
   */
  export type Lib = {
    /**
     * Start one bounded Rooted materialization operation.
     *
     * The returned handle separates explicit cancellation, observation-only events, and terminal
     * settlement through `done`.
     */
    start(options: StartOptions): ResourceOperation.Instance;
  };

  /** One checksum-pinned resource with an explicit root-relative destination. */
  export type Resource = {
    /** Absolute HTTP(S) source admitted by the response policy. */
    readonly source: t.StringUrl;
    /** Destination submitted to the Rooted capability for admission. */
    readonly target: t.StringRelativePath;
    /** Caller-supplied canonical SHA-256; its provenance defines artifact authority. */
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
    /** Maximum attempts per resource, including the first; batch accounting stays safe-integer. */
    readonly maxAttempts: number;
    /** Fixed delay between retry attempts; zero yields through the microtask scheduler. */
    readonly retryDelay: t.Msecs;
    /** Retry window after the first attempt; each attempt remains bounded by `response.timeout`. */
    readonly maxRetryElapsed: t.Msecs;
    /** Aggregate transfer bound with safe-integer headroom for concurrent overrun evidence. */
    readonly maxTotalBytes: t.NumberBytes;
    /** Maximum elapsed time for the complete operation. */
    readonly totalTimeout: t.Msecs;
  };

  /** Optional credential construction data snapshotted before admission or transport. */
  export type ResourceCredentials = t.HttpFetch.DefaultHeaders.Options;

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

  /** Stable Rooted failure evidence. */
  export type RootedFailureEvidence = {
    readonly operation: t.Fs.Rooted.Operation;
    readonly kind: t.Fs.Rooted.FailureKind;
    readonly committed: boolean;
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
  export type Result = ResultSuccess | ResultFailure;

  /** Every resource authenticated and published successfully. */
  export type ResultSuccess = {
    readonly ok: true;
    readonly ops: readonly ResourceRecordSuccess[];
    readonly totals: ResourceTotals;
    readonly terminal?: undefined;
  };

  /** At least one resource failed or the operation reached a terminal bound/cancellation. */
  export type ResultFailure = {
    readonly ok: false;
    readonly ops: readonly ResourceRecord[];
    readonly totals: ResourceTotals;
    readonly terminal?: ResourceTerminalFailure;
  };

  /**
   * Checksum-pinned Pull operation contracts.
   */
  export namespace ResourceOperation {
    /** Explicit operation control and observation. */
    export type Instance = {
      /**
       * Create an independently disposable hot, non-replaying event view.
       *
       * Disposing a view never cancels the operation or sibling views.
       */
      readonly events: (until?: t.UntilInput) => Events;
      /**
       * Cancel queued and in-flight work without exposing abort-controller authority.
       *
       * Committed publication truth remains terminal evidence.
       */
      readonly cancel: (reason?: unknown) => void;
      /** Resolve only after complete worker quiescence and terminal accounting. */
      readonly done: Promise<Result>;
    };

    /** Independently disposable event view. */
    export type Events = t.Lifecycle & {
      readonly $: t.Observable<t.HttpPull.ResourceEvent.Any>;
    };
  }

  /**
   * Checksum-pinned operation events.
   */
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
}
