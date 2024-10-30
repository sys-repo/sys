import type { t } from '../common.ts';

export type ErrorGeneratorInput = unknown;

/**
 * Helpers for working with errors.
 */
export type ErrLib = {
  readonly Is: t.ErrIs;
  readonly Name: t.ErrNameLib;

  /**
   * Take unknown input and produce a standard error object.
   */
  std(input: ErrorGeneratorInput, options?: t.ErrStdOptions | string): t.StdError;

  /**
   * Create a new error collection builder.
   */
  errors(): t.ErrorCollection;
};

/**
 * Options passed to the `ErrLib.stdErr` method.
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

/**
 * ErrorCollection
 *
 * A builder that let's a number of errors be built up
 * during the course of a method, and then resolve into
 * a single StdError.
 */
export type ErrorCollection = {
  readonly length: number;

  /** The list of errors. */
  readonly list: ReadonlyArray<t.StdError>;

  /** Boolean status flags. */
  readonly is: { readonly empty: boolean };

  /** Add a new error. */
  add(error: ErrorGeneratorInput | ErrorGeneratorInput[]): ErrorCollection;

  /**
   * Resolve the collection of errors to either
   *  - no error (undefined) when empty,
   *  - a single StdError,
   *  - or an single Aggregate error containing the collection as child errors.
   */
  toError(pluralMessage?: string): t.StdError | undefined;
};
