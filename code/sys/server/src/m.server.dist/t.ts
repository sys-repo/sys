import type { Pkg as FsPkg } from '@sys/fs/t';
import type { HttpFetch, HttpPull } from '@sys/http/t';
import type { t } from './common.ts';

/**
 * Immutable verified Dist materialization contracts.
 */
export declare namespace ServerDist {
  /** Product-neutral verified Dist materialization API. */
  export type Lib = {
    /** Materialize one externally pinned remote Dist as an immutable local generation. */
    readonly materialize: Method;
  };

  /** Materialize one externally pinned remote Dist. */
  export type Method = (args: MaterializeArgs) => Promise<MaterializeResult>;

  /** One-shot materialization input. */
  export type MaterializeArgs = {
    /** Absolute HTTP(S) URL of the exact pinned `dist.json` bytes. */
    readonly manifestUrl: t.StringUrl;
    /** Canonical SHA-256 of the exact serialized `dist.json` bytes. */
    readonly integrity: t.StringHash;
    /** Parent directory for immutable integrity-addressed generations. */
    readonly storeDir: t.StringDir;
    /** Required finite acquisition and verification authority. */
    readonly policy: Policy;
    /** Optional independently confined credential construction data. */
    readonly credentials?: Credentials;
    /** Caller lifecycle applied until a publication outcome becomes visible. */
    readonly until?: t.UntilInput;
  };

  /** Canonical owner policies composed by the materializer. */
  export type Policy = {
    /** Bounded manifest Fetch authority. */
    readonly manifest: HttpFetch.ResponsePolicy;
    /** Bounded checksum-pinned asset Pull authority. */
    readonly resources: HttpPull.ResourcePolicy;
    /** Bounded complete-generation verification authority. */
    readonly verification: FsPkg.Dist.VerifyPinned.Limits;
  };

  /** Manifest Fetch credential construction data. */
  export type ManifestCredentials = Readonly<
    Pick<HttpFetch.CreateOptions, 'accessToken' | 'headers'>
  >;

  /** Independently confined manifest and asset credentials. */
  export type Credentials = {
    readonly manifest?: ManifestCredentials;
    readonly resources?: HttpPull.ResourceCredentials;
  };

  /** Terminal materialization result. */
  export type MaterializeResult = Existing | Promoted | Failed;

  /** Private-stage cleanup truth. */
  export type Cleanup = 'not-needed' | 'complete' | 'pending';

  /** Sanitized configured manifest source evidence. */
  export type ConfiguredSource = {
    /** Configured origin and path with userinfo, query, and fragment removed. */
    readonly configuredUrl: t.StringUrl;
  };

  /** Sanitized source evidence observed while fetching the promoted generation. */
  export type ObservedSource = ConfiguredSource & HttpFetch.ResponsePolicy.SourceEvidence;

  /** Evidence shared by successful final-directory verification results. */
  type Success = {
    /** Canonical admitted immutable-generation directory. */
    readonly dir: t.StringAbsoluteDir;
    /** Exact external manifest pin naming this generation. */
    readonly integrity: t.StringHash;
    /** Fresh owner evidence produced against this exact returned directory. */
    readonly verification: FsPkg.Dist.VerifyPinned.Evidence;
    /** Private-stage cleanup truth. */
    readonly cleanup: Cleanup;
    readonly stage?: undefined;
    readonly reason?: undefined;
    readonly publication?: undefined;
  };

  /** A pre-existing or concurrent-winner generation verified successfully. */
  export type Existing = Success & {
    readonly kind: 'existing';
    readonly source: ConfiguredSource;
    readonly totals?: undefined;
  };

  /** This invocation published and then verified the immutable generation. */
  export type Promoted = Success & {
    readonly kind: 'promoted';
    readonly source: ObservedSource;
    readonly totals: HttpPull.ResourceTotals;
  };

  /** Stable orchestration stage for a failed result. */
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

  /** Visible target truth known despite failed verified-generation settlement. */
  export type FailedPublication = 'committed' | 'occupied';

  /** Failed materialization with no authority-bearing or path-bearing evidence. */
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
