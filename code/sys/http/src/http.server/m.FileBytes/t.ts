/**
 * Constrained HTTP file-byte response contracts.
 */
export declare namespace FileBytes {
  /** Emit one constrained response from lazily supplied bytes. */
  export type Method = (args: Args) => Promise<Response>;

  /** Arguments passed to `serveFileBytes`. */
  export type Args = {
    /** Incoming request whose method and Range policy are enforced before reading. */
    readonly req: Request;
    /** Admitted logical filename used only for MIME selection. */
    readonly path: string;
    /** Required cache policy. */
    readonly cache: 'no-store';
    /** Lazily supply exact bytes or a neutral read failure. */
    readonly read: Read.Method;
  };

  /** Lazy byte-read contracts. */
  export namespace Read {
    /** Supply exact bytes or a neutral read failure. */
    export type Method = () => Promise<Result>;

    /** Result returned by the lazy byte reader. */
    export type Result = Bytes | Failure;

    /** Exact bytes admitted for response emission. */
    export type Bytes = {
      readonly kind: 'bytes';
      readonly bytes: Uint8Array;
    };

    /** Neutral read failure without filesystem or checksum vocabulary. */
    export type Failure = {
      readonly kind: FailureKind;
    };

    /**
     * Stable neutral read-failure classification.
     *
     * `cancelled` maps to the package's generic HTTP 499 cancellation response. It does not prove
     * that the HTTP client disconnected.
     */
    export type FailureKind = 'missing' | 'changed' | 'cancelled' | 'failure';
  }
}
