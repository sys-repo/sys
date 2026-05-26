import type { t } from '../common.ts';
import type * as TErrIs from './t.is.ts';
import type * as TErrLib from './t.lib.ts';

export type { ErrSummaryOptions } from './t.lib.ts';

/** Input for an error generator. */
export type ErrorGeneratorInput = unknown | Response;

/**
 * The response (and/or error) from an [Err.catch] method call.
 */
export type ErrCatch<T> = ErrSuccess<T> | ErrFail<T>;
/** Successful result wrapper with data and no error. */
export type ErrSuccess<T> = { ok: true; data: T; error: undefined };
/** Failed result wrapper with optional data and an error. */
export type ErrFail<T> = { ok: false; data?: T; error: t.StdError };

/**
 * Options passed to the `Err.std` method.
 */
export type ErrStdOptions = {
  /** The name/type of this error. */
  name?: string;

  /** A sub-error that represents the cause of this error. */
  cause?: unknown;

  /** A list of errors when creating an Aggregate error. */
  errors?: (t.StdError | unknown)[];
};

/**
 * Error helper contracts.
 */
export declare namespace Err {
  /** Helpers for working with errors. */
  export type Lib = TErrLib.Lib;

  /**
   * Error type guard contracts.
   */
  export namespace Is {
    /** Type guards. */
    export type Lib = TErrIs.Lib;
  }

  /**
   * Standard error-name contracts.
   */
  export namespace Name {
    /** The standard named error types. */
    export type Lib = {
      readonly error: 'Error';
      readonly aggregate: 'AggregateError';
      readonly eval: 'EvalError';
      readonly range: 'RangeError';
      readonly reference: 'ReferenceError';
      readonly syntax: 'SyntaxError';
      readonly type: 'TypeError';
      readonly uri: 'URIError';
      readonly compile: 'CompileError';
      readonly link: 'LinkError';
      readonly runtime: 'RuntimeError';
      readonly internal: 'InternalError';
    };
  }
}

/**
 * ErrorCollection
 *
 * A builder that let's a number of errors be built up
 * during the course of a method, and then resolve into
 * a single StdError.
 */
export type ErrorCollection = {
  readonly ok: boolean;

  readonly length: number;

  /** The list of errors. */
  readonly items: ReadonlyArray<t.StdError>;

  /** Boolean status flags. */
  readonly is: { readonly empty: boolean };

  /** Add a new error. */
  push(error: t.ErrorGeneratorInput | t.ErrorGeneratorInput[]): ErrorCollection;
  push(error: t.ErrorGeneratorInput, options?: t.ErrStdOptions | string): ErrorCollection;

  /**
   * Resolve the collection of errors to either
   *  - no error (undefined) when empty,
   *  - a single StdError,
   *  - or an single Aggregate error containing the collection as child errors.
   */
  toError(pluralMessage?: string): t.StdError | undefined;
};
