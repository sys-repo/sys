import type { Pkg as FsPkg } from '@sys/fs/t';
import type { HttpFetch, HttpPull, HttpServer } from '@sys/http/t';
import type { t } from './common.ts';

/**
 * Contracts for checksum-pinned Dist materialization and final-directory evidence.
 */
export declare namespace Dist {
  /** Product-neutral API for checksum-pinned Dist generations. */
  export type Lib = {
    /**
     * Settle one pinned Dist as `existing`, `promoted`, or `failed`.
     *
     * Every success carries fresh verification evidence for its exact returned directory.
     */
    readonly materialize: Materialize;
  };

  /**
   * Settle one pinned Dist as `existing`, `promoted`, or `failed`.
   *
   * Every success carries fresh verification evidence for its exact returned directory.
   */
  export type Materialize = (args: MaterializeArgs) => Promise<MaterializeResult>;

  /** Complete caller authority for one materialization attempt. */
  export type MaterializeArgs = {
    /** Absolute HTTP(S) location of the `dist.json` to authenticate. */
    readonly manifestUrl: t.StringUrl;
    /** Caller-supplied canonical SHA-256 pin for the exact `dist.json` response bytes. */
    readonly integrity: t.StringHash;
    /** Root directory whose children are integrity-addressed generations. */
    readonly storeDir: t.StringDir;
    /** Required finite authority for acquisition and complete-generation verification. */
    readonly policy: Policy;
    /** Optional credentials confined independently to manifest and asset requests. */
    readonly credentials?: Credentials;
    /** Caller lifecycle for cancellable work; visible publication outcomes settle independently. */
    readonly until?: t.UntilInput;
  };

  /** Finite authority composed from canonical transport and verification policies. */
  export type Policy = {
    /** Bounded manifest Fetch authority. */
    readonly manifest: HttpFetch.ResponsePolicy;
    /** Bounded checksum-pinned asset Pull authority. */
    readonly resources: HttpPull.ResourcePolicy;
    /** Bounded complete-generation verification authority. */
    readonly verification: FsPkg.Dist.Pinned.Verify.Limits;
  };

  /** Manifest-request credentials; callbacks run only when network work is required. */
  export type ManifestCredentials = HttpFetch.DefaultHeaders.Options;

  /** Credentials confined independently to manifest and asset origins. */
  export type Credentials = {
    readonly manifest?: ManifestCredentials;
    readonly resources?: HttpPull.ResourceCredentials;
  };

  /** Terminal truth for the integrity-addressed generation target. */
  export type MaterializeResult = Existing | Promoted | Failed;

  /** Safe private-stage cleanup outcome; never a claim that a generation was rolled back. */
  export type Cleanup = 'not-needed' | 'complete' | 'pending';

  /** Sanitized configured manifest source evidence. */
  export type ConfiguredSource = {
    /** Configured origin and path with userinfo, query, and fragment removed. */
    readonly configuredUrl: t.StringUrl;
  };

  /** Sanitized source evidence observed while fetching the promoted generation. */
  export type ObservedSource = ConfiguredSource & HttpFetch.ResponsePolicy.SourceEvidence;

  /** Truth shared by successes freshly verified at their returned final directory. */
  type Success = {
    /** Canonical admitted generation directory. */
    readonly dir: t.StringAbsoluteDir;
    /** Exact external manifest pin naming this generation. */
    readonly integrity: t.StringHash;
    /** Fresh owner evidence produced against this exact returned directory. */
    readonly verification: FsPkg.Dist.Pinned.Verify.Evidence;
    /** Private-stage cleanup truth. */
    readonly cleanup: Cleanup;
    readonly stage?: undefined;
    readonly reason?: undefined;
    readonly publication?: undefined;
  };

  /** Freshly verified generation that pre-existed or won a concurrent promotion. */
  export type Existing = Success & {
    readonly kind: 'existing';
    readonly source: ConfiguredSource;
    readonly totals?: undefined;
  };

  /** Generation published here and then freshly verified at its final directory. */
  export type Promoted = Success & {
    readonly kind: 'promoted';
    readonly source: ObservedSource;
    readonly totals: HttpPull.ResourceTotals;
  };

  /** Stable orchestration phase in which materialization failed. */
  export type FailureStage =
    | 'input'
    | 'storage'
    | 'existing-verification'
    | 'manifest-fetch'
    | 'manifest-admission'
    | 'staging'
    | 'resource-pull'
    | 'stage-verification'
    | 'promotion'
    | 'final-verification';

  /** Stable sanitized reason for a failed result. */
  export type FailureReason =
    | 'invalid-input'
    | 'invalid-policy'
    | 'cancelled'
    | 'source-denied'
    | 'timeout'
    | 'limit-exceeded'
    | 'integrity-mismatch'
    | 'malformed-manifest'
    | 'resource-failure'
    | 'verification-failure'
    | 'filesystem-failure'
    | 'execution-failure';

  /** Visible target state known even though final verified settlement failed. */
  export type FailedPublication = 'committed' | 'occupied';

  /** Sanitized failure without paths, raw causes, credentials, or verification evidence. */
  export type Failed = {
    readonly kind: 'failed';
    readonly stage: FailureStage;
    readonly reason: FailureReason;
    readonly cleanup: Cleanup;
    readonly publication?: FailedPublication;
    readonly dir?: undefined;
    readonly integrity?: undefined;
    readonly verification?: undefined;
    readonly source?: undefined;
    readonly totals?: undefined;
  };
}

/**
 * Checksum-pinned local Dist hosting contracts.
 */
export declare namespace DistServer {
  /** Direct verified-or-refuse Dist hosting surface. */
  export type Lib = {
    readonly start: (args: Start.Args) => Promise<Started>;
    readonly startLocal: (args: Start.Local.Args) => Promise<Started>;
    readonly Error: Error.Lib;
  };

  export namespace Start {
    /**
     * Start one checksum-pinned Dist host.
     *
     * Unlike `Dist.materialize`, this method has one success truth: it returns the existing HTTP
     * lifecycle and rejects every startup failure as a sanitized `StartError`.
     */
    export namespace Pinned {
      export type Args = {
        /** Local generation directory containing the pinned `dist.json`. */
        dir: t.StringDir;
        /** Canonical SHA-256 pin for the exact `dist.json` bytes. */
        integrity: t.StringHash;
        /** Required finite complete-generation verification authority. */
        limits: FsPkg.Dist.Pinned.Verify.Limits;
        /** Loopback hostname. Defaults to `127.0.0.1`. */
        hostname?: t.StringHostname;
        /** Listen port. Defaults to an ephemeral port. */
        port?: t.PortNumber;
        /** Optional owner-local display name. */
        name?: string;
        /** Suppress owner-local startup output. */
        silent?: boolean;
        /** Optional keyboard controls delegated to the HTTP lifecycle owner. */
        keyboard?: HttpServer.Start.Options['keyboard'];
        /** Caller lifecycle for verification, serving, and admitted part reads. */
        until?: t.UntilInput;
      };
    }

    /**
     * Start one local, non-authoritative Dist host.
     *
     * Local starts derive manifest integrity from observed local bytes and still refuse startup if the
     * observed generation mutates, contains undeclared entries, or fails complete verification.
     */
    export namespace Local {
      export type Args = {
        /** Local generation directory containing the `dist.json` file. */
        dir: t.StringDir;
        /** Required finite complete-generation verification authority. */
        limits: FsPkg.Dist.Verify.Limits;
        /** Loopback hostname. Defaults to `127.0.0.1`. */
        hostname?: t.StringHostname;
        /** Listen port. Defaults to an ephemeral port. */
        port?: t.PortNumber;
        /** Optional owner-local display name. */
        name?: string;
        /** Suppress owner-local startup output. */
        silent?: boolean;
        /** Optional keyboard controls delegated to the HTTP lifecycle owner. */
        keyboard?: HttpServer.Start.Options['keyboard'];
        /** Caller lifecycle for verification, serving, and admitted part reads. */
        until?: t.UntilInput;
      };
    }

    /** Default (pinned) start arguments. */
    export type Args = Pinned.Args;
  }

  /** Stable runtime truth when one Dist host is successfully started. */
  export type Started = HttpServer.Started & {
    /** Authority provenance for this started host. */
    readonly authority:
      | { readonly kind: 'pinned'; readonly integrity: t.StringHash }
      | { readonly kind: 'local-unpinned'; readonly integrity: t.StringHash };
    /** Immutable evidence from the exact generation verification used to start this host. */
    readonly verification: FsPkg.Dist.Verify.Evidence;
  };

  /** Stable sanitized startup failure reasons. */
  export type StartFailureReason =
    | FsPkg.Dist.Verify.FailureKind
    | 'invalid-hostname'
    | 'address-in-use'
    | 'startup-failure';

  /** Frozen startup failure without embedded input or cause details. */
  export type StartError = globalThis.Error & {
    readonly name: 'DistServer.StartError';
    readonly reason: StartFailureReason;
    readonly cause?: never;
  };

  /**
   * Startup-error classifier contracts.
   */
  export namespace Error {
    export type Lib = {
      /** Determine whether a value is an authentic DistServer startup failure. */
      readonly is: (value: unknown) => value is StartError;
    };
  }
}
