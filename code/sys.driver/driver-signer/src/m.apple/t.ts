import type { Signer } from '@sys/driver-signer/t';
import type { t } from './common.ts';

export namespace AppleSigner {
  export type Target = 'apple';
  export type Lib = {
    capabilities(): Capabilities;
    run(input: RunInput): Promise<Result>;
  };

  /** Reuse core capability contract verbatim. */
  export type Capabilities = Signer.Capabilities;

  /** Apple-local mode vocabulary. */
  export type Mode = 'sign-only' | 'sign-verify' | 'sign-notarize-verify';

  /**
   * Artifact vocabulary for Apple signer targets.
   * - `app`: macOS application bundle (`.app`) to codesign/verify/notarize/staple.
   * - `dmg`: disk image container (`.dmg`) used for distribution.
   */
  export type ArtifactKind = 'app' | 'dmg';

  /**
   * Apple-local lifecycle stages.
   * We keep notarize/staple explicit rather than forcing dist-centric stages.
   */
  export type Stage =
    | 'input'
    | 'read'
    | 'sign'
    | 'notarize'
    | 'staple'
    | 'verify'
    | 'output'
    | 'internal';

  /**
   * Apple-local error taxonomy.
   * Mirrors core shape while preserving apple-specific failure boundaries.
   */
  export type ErrorCode =
    | 'E_INPUT'
    | 'E_READ'
    | 'E_SIGN'
    | 'E_NOTARIZE'
    | 'E_STAPLE'
    | 'E_VERIFY'
    | 'E_INTERNAL';

  export type NotaryAuth = {
    /** App Store Connect API key identifier. */
    readonly keyId: string;
    /** App Store Connect issuer identifier. */
    readonly issuerId: string;
    /** Path to the `.p8` private key file used for notarization. */
    readonly keyP8Path: t.StringPath;
  };

  export type RunInputBase = {
    /** Requested Apple signer workflow. */
    readonly mode: Mode;
    /** Path to the `.app` or `.dmg` artifact. */
    readonly artifactPath: t.StringPath;
    /** Artifact kind used to shape signing commands. */
    readonly artifactKind: ArtifactKind;
    /** Exact codesign identity string. */
    readonly identity: string;
  };

  export type RunInputSignOnly = RunInputBase & {
    readonly mode: 'sign-only';
    readonly notary?: undefined;
  };

  export type RunInputSignVerify = RunInputBase & {
    readonly mode: 'sign-verify';
    readonly notary?: undefined;
  };

  export type RunInputSignNotarizeVerify = RunInputBase & {
    readonly mode: 'sign-notarize-verify';
    readonly notary: NotaryAuth;
  };

  export type RunInput = RunInputSignOnly | RunInputSignVerify | RunInputSignNotarizeVerify;

  export type RunData = {
    /** Signer target that produced the result. */
    readonly target: Target;
    /** Requested Apple signer workflow. */
    readonly mode: Mode;
    /** Path to the processed artifact. */
    readonly artifactPath: t.StringPath;
    /** Artifact kind that was processed. */
    readonly artifactKind: ArtifactKind;
    /** Signing completed successfully. */
    readonly signed: boolean;
    /** Verification completed successfully. */
    readonly verified: boolean;
    /** Notarization completed successfully. */
    readonly notarized: boolean;
    /** Stapling completed successfully. */
    readonly stapled: boolean;
  };

  export type ResultOk = {
    /** Success discriminator. */
    readonly ok: true;
    /** Success payload. */
    readonly data: RunData;
    /** Success case never includes an error. */
    readonly error: undefined;
  };

  export type ResultFail = {
    /** Failure discriminator. */
    readonly ok: false;
    /** Partial run context captured before failure. */
    readonly data?: Partial<RunData>;
    /** Failure details. */
    readonly error: t.StdError;
    /** Stable machine-readable failure code. */
    readonly code: ErrorCode;
    /** Lifecycle stage where the failure occurred. */
    readonly stage: Stage;
  };

  export type Result = ResultOk | ResultFail;
}
