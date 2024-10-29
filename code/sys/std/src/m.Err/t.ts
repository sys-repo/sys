import type { t } from '../common.ts';

/**
 * Options passed to the `ErrLib.stdErr` method.
 */
export type ErrStdErrorOptions = {
  /* The name/type of this error. */
  name?: string;

  /* A sub-error that represents the cause of this error. */
  cause?: unknown;

  /* A list of errors when creating an Aggregate error. */
  errors?: (t.StdError | unknown)[];
};

/**
 * Helpers for working with errors.
 */
export type ErrLib = {
  readonly Is: t.ErrIs;
  readonly Name: t.ErrNameLib;

  /**
   * Take unknown input and produce a standard error object.
   */
  std(input: unknown, options?: t.ErrStdErrorOptions | string): t.StdError;
};

/**
 * The standard named error types.
 */
export type ErrNameLib = {
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

/**
 * Type guards (boolean evaluators).
 */
export type ErrIs = {
  /**
   * Determine if the given value is "like" an error in that it
   * exposes a {message} property.
   */
  errorLike(input: unknown): input is t.ErrorLike;

  /**
   * Determine if the given value conforms to the `StdError` type.
   */
  stdError(input: unknown): input is t.StdError;

  /**
   * Determine if the `StdError` is an aggregate of other errors,
   * (aka. it has a [errors] array).
   */
  aggregate(input: unknown): input is t.StdError;
};
