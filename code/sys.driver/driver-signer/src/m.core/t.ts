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
    readonly target: Target;
    readonly sign: boolean;
    readonly verify: boolean;
    readonly detachedSignature: boolean;
    readonly embeddedSignature: boolean;
    readonly notarize: boolean;
    readonly staple: boolean;
    readonly timestamp: boolean;
  };

  export type ResultData = {
    readonly target: Target;
    readonly mode: Mode;
  };

  export type ResultOk = {
    readonly ok: true;
    readonly data: ResultData;
    readonly error: undefined;
  };

  export type ResultFail = {
    readonly ok: false;
    readonly data?: Partial<ResultData>;
    readonly error: t.StdError;
    readonly code: ErrorCode;
    readonly stage: Stage;
  };

  export type Result = ResultOk | ResultFail;
}
