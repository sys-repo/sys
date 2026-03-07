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
    readonly keyId: string;
    readonly issuerId: string;
    readonly keyP8Path: t.StringPath;
  };

  export type RunInputBase = {
    readonly mode: Mode;
    readonly artifactPath: t.StringPath;
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
    readonly target: Target;
    readonly mode: Mode;
    readonly artifactPath: t.StringPath;
    readonly artifactKind: ArtifactKind;
    readonly signed: boolean;
    readonly verified: boolean;
    readonly notarized: boolean;
    readonly stapled: boolean;
  };

  export type ResultOk = {
    readonly ok: true;
    readonly data: RunData;
    readonly error: undefined;
  };

  export type ResultFail = {
    readonly ok: false;
    readonly data?: Partial<RunData>;
    readonly error: t.StdError;
    readonly code: ErrorCode;
    readonly stage: Stage;
  };

  export type Result = ResultOk | ResultFail;
}
