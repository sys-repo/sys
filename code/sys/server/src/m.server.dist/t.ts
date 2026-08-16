import type { FsRooted, Pkg as FsPkg } from '@sys/fs/t';
import type { HttpFetch, HttpPull, HttpServer } from '@sys/http/t';
import type { t } from './common.ts';

/**
 * Contracts for checksum-pinned Dist materialization, sealing, and final-directory evidence.
 */
export declare namespace Dist {
  /** Product-neutral API for checksum-pinned Dist generations. */
  export type Lib = {
    /**
     * Settle one pinned Dist as `existing`, `promoted`, or `failed`.
     *
     * Every success carries fresh verification and applied sealing evidence for its exact returned
     * directory.
     */
    readonly materialize: Materialize;
  };

  /**
   * Settle one pinned Dist as `existing`, `promoted`, or `failed`.
   *
   * Every success carries fresh verification and applied sealing evidence for its exact returned
   * directory.
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
    /** Frozen lower-owner evidence that the complete returned generation is sealed. */
    readonly seal: FsRooted.SealApplied;
    /** Private-stage cleanup truth. */
    readonly cleanup: Cleanup;
    readonly stage?: undefined;
    readonly reason?: undefined;
    readonly publication?: undefined;
  };

  /** Freshly verified generation whose publication was not proven by this attempt. */
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
    | 'sealing'
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
    | 'unsupported'
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
    readonly seal?: undefined;
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
    /** Start one checksum-pinned Dist host and return its lifecycle. */
    readonly start: (args: Start.Args) => Promise<Started>;
    /** Blocking terminal-owned serve with pinned authority semantics. */
    readonly serve: (args: Serve.Args) => Promise<void>;
    /** Explicit locally verified, unpinned authority family. */
    readonly Local: Local.Lib;
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
        /** Optional explicit browser-origin authority applied to this verified generation. */
        browserPolicy?: BrowserPolicy.Input;
        /** Optional owner-local display name. */
        name?: string;
        /** Suppress owner-local startup output. */
        silent?: boolean;
        /** Optional keyboard controls for the hosting lifecycle. */
        keyboard?: HttpServer.Start.Options['keyboard'];
        /** Caller lifecycle for verification, serving, and admitted part reads. */
        until?: t.UntilInput;
      };
    }

    /** Default (pinned) start arguments. */
    export type Args = Pinned.Args;
  }

  /** Terminal-only presentation inputs for pinned serve mode. */
  export namespace Serve {
    /** Pinned start authority plus an optional package-application subpath. */
    export type Args = Start.Args & {
      /** Raw package subpath rendered only after verified package resolution. */
      pkgSubpath?: string;
    };
  }

  /** Explicit locally verified, unpinned authority family. */
  export namespace Local {
    export type Lib = {
      /** Start one locally verified Dist host and return its lifecycle. */
      readonly start: (args: Args) => Promise<Started>;
      /** Blocking terminal-owned serve for locally verified, unpinned authority. */
      readonly serve: (args: ServeArgs) => Promise<void>;
    };

    /**
     * Local authority derives manifest integrity from observed bytes and still refuses startup if the
     * observed generation mutates, contains undeclared entries, or fails complete verification.
     */
    export type Args = {
      /** Local generation directory containing the `dist.json` file. */
      dir: t.StringDir;
      /** Required finite complete-generation verification authority. */
      limits: FsPkg.Dist.Verify.Limits;
      /** Loopback hostname. Defaults to `127.0.0.1`. */
      hostname?: t.StringHostname;
      /** Listen port. Defaults to an ephemeral port. */
      port?: t.PortNumber;
      /** Optional explicit browser-origin authority applied to this verified generation. */
      browserPolicy?: BrowserPolicy.Input;
      /** Optional owner-local display name. */
      name?: string;
      /** Suppress owner-local startup output. */
      silent?: boolean;
      /** Optional keyboard controls for the hosting lifecycle. */
      keyboard?: HttpServer.Start.Options['keyboard'];
      /** Caller lifecycle for verification, serving, and admitted part reads. */
      until?: t.UntilInput;
    };

    /** Local start authority plus terminal-only package-application presentation. */
    export type ServeArgs = Args & {
      /** Raw package subpath rendered only after verified package resolution. */
      pkgSubpath?: string;
    };
  }

  /**
   * Explicit browser-origin authority for one exact verified Dist.
   *
   * Omit this policy to retain generic Dist hosting. Selecting it switches the listener to exact
   * numeric-loopback authority and applies the complete closed response/request policy below.
   */
  export namespace BrowserPolicy {
    /** Caller-selected browser authority. Every selected asset must exist in the verified Dist. */
    export type Input = {
      /** Closed browser-policy variant for a verified numeric-loopback listener. */
      readonly kind: 'verified-loopback';
      /** Exact sources admitted for dedicated workers. An empty list denies dedicated workers. */
      readonly dedicatedWorkers: readonly DedicatedWorker.Source[];
      /** Independent Service Worker request admission. */
      readonly serviceWorker: ServiceWorker.Admission;
    };

    /** Dedicated-worker source authority. */
    export namespace DedicatedWorker {
      /** One explicit dedicated-worker source capability. */
      export type Source = Asset | Blob;
      /** One exact verified Dist asset admitted as a dedicated-worker source. */
      export type Asset = {
        readonly kind: 'asset';
        readonly path: t.Files.String.Path;
      };
      /** Explicit `blob:` bootstrap authority tied to one exact verified worker module. */
      export type Blob = {
        readonly kind: 'blob';
        readonly worker: t.Files.String.Path;
      };
    }

    /** Service Worker request authority, kept distinct from dedicated workers. */
    export namespace ServiceWorker {
      /** Deny every observed Service Worker destination, or admit one exact verified tombstone. */
      export type Admission = Deny | Tombstone;
      /** Deny every observed Service Worker destination. */
      export type Deny = {
        readonly kind: 'deny';
      };
      /** Admit one exact verified inert migration asset for observed Service Worker requests. */
      export type Tombstone = {
        readonly kind: 'tombstone';
        readonly path: t.Files.String.Path;
      };
    }

    /** Fixed response headers applied by the selected browser policy. */
    export type Headers = {
      readonly cacheControl: 'no-store';
      readonly contentSecurityPolicy: string;
      readonly crossOriginOpenerPolicy: 'same-origin';
      readonly crossOriginResourcePolicy: 'same-origin';
      readonly referrerPolicy: 'no-referrer';
      readonly xContentTypeOptions: 'nosniff';
      readonly xFrameOptions: 'DENY';
    };

    /** Immutable evidence of the browser authority actually applied by the started host. */
    export type Applied = {
      /** Closed browser-policy variant applied by this host. */
      readonly kind: 'verified-loopback';
      /** Canonical numeric-loopback origin owned by the settled listener. */
      readonly origin: t.StringUrl;
      /** The one exact request Host authority admitted by the host. */
      readonly host: string;
      /** Exact dedicated-worker sources applied to this verified Dist. */
      readonly dedicatedWorkers: readonly DedicatedWorker.Source[];
      /** Independent Service Worker request admission applied to this verified Dist. */
      readonly serviceWorker: ServiceWorker.Admission;
      /** Fetch Metadata handling; omission remains compatible with direct clients. */
      readonly fetchMetadata: {
        readonly crossSite: 'deny';
        readonly missing: 'allow';
      };
      /** Exact fixed response headers applied on success and error responses. */
      readonly headers: Headers;
    };
  }

  /** Stable runtime truth when one Dist host is successfully started. */
  export type Started = HttpServer.Started & {
    /** Authority provenance for this started host. */
    readonly authority:
      | { readonly kind: 'pinned'; readonly integrity: t.StringHash }
      | { readonly kind: 'local-unpinned'; readonly integrity: t.StringHash };
    /** Immutable evidence from the exact generation verification used to start this host. */
    readonly verification: FsPkg.Dist.Verify.Evidence;
    /** Frozen applied browser authority, when explicitly selected by the caller. */
    readonly browserPolicy?: BrowserPolicy.Applied;
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
