import type { t } from './common.ts';

/**
 * Shared signer contracts and runtime vocabulary so target drivers
 * (apple/windows/linux/content) stay consistent and truthful.
 */
export namespace Signer {
  export type Target = 'content-manifest' | 'apple' | 'windows' | 'linux';
  export type Mode = 'sign' | 'verify' | 'sign-verify';

  /** Library: */
  export type Lib = {};

  /**
   * Canonical lifecycle stage labels used for reporting and failures.
   */
  export type Stage =
    | 'input'
    | 'read'
    | 'parse'
    | 'canonicalize'
    | 'sign'
    | 'verify'
    | 'write'
    | 'output'
    | 'internal';

  /**
   * Stable machine-readable error categories for signer operations.
   */
  export type ErrorCode =
    | 'E_INPUT'
    | 'E_READ'
    | 'E_PARSE'
    | 'E_CANONICALIZE'
    | 'E_SIGN'
    | 'E_VERIFY'
    | 'E_WRITE'
    | 'E_INTERNAL';

  /**
   * Truthful capability declaration for a signer target.
   */
  export type Capabilities = {
    /** Signer target implemented by the driver. */
    readonly target: Target;
    /** Driver can produce signatures. */
    readonly sign: boolean;
    /** Driver can verify signatures. */
    readonly verify: boolean;
    /** Driver supports detached signature files. */
    readonly detachedSignature: boolean;
    /** Driver supports signatures embedded in the artifact. */
    readonly embeddedSignature: boolean;
    /** Driver supports notarization. */
    readonly notarize: boolean;
    /** Driver supports stapling notarization tickets. */
    readonly staple: boolean;
    /** Driver supports trusted timestamping. */
    readonly timestamp: boolean;
  };

  export type ResultData = {
    /** Signer target that produced the result. */
    readonly target: Target;
    /** Requested operation mode. */
    readonly mode: Mode;
  };

  export type ResultOk = {
    /** Success discriminator. */
    readonly ok: true;
    /** Success payload. */
    readonly data: ResultData;
    /** Success case never includes an error. */
    readonly error: undefined;
  };

  export type ResultFail = {
    /** Failure discriminator. */
    readonly ok: false;
    /** Partial result context captured before failure. */
    readonly data?: Partial<ResultData>;
    /** Failure details. */
    readonly error: t.StdError;
    /** Stable machine-readable failure code. */
    readonly code: ErrorCode;
    /** Lifecycle stage where the failure occurred. */
    readonly stage: Stage;
  };

  export type Result = ResultOk | ResultFail;
}
