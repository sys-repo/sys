import type { t } from './common.ts';

/** Successful result containing resolved data and no error. */
export type TryOk<T> = {
  readonly ok: true;
  readonly data: T;
  readonly error: undefined;
};

/** Failed result containing a native Error. */
export type TryFail = {
  readonly ok: false;
  readonly error: Error;
};

/** Discriminated union representing the outcome of a Try.catch call. */
export type TryResult<T> = TryOk<T> | TryFail;

/** Overload: sync thunk → TryResult<T>; async thunk → Promise<TryResult<T>>. */
export type TryCatch = {
  <T = never>(fn: () => never): TryResult<T>; //        pure throwers
  <T>(fn: () => Promise<T>): Promise<TryResult<T>>; //  async thunk
  <T>(fn: () => T): TryResult<T>; //                    sync thunk
};

/**
 * Helpers for safe try/catch execution.
 */
export type TryLib = {
  /** Execute a function safely, returning a result object instead of throwing. */
  readonly catch: TryCatch;
};
