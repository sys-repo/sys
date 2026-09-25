import type { t } from './common.ts';

/** Helpers for working with errors. */
export type Lib = {
  /** Type guards (boolean evaluators). */
  readonly Is: t.Err.Is.Lib;
  /** The standard named error types. */
  readonly Name: t.Err.Name.Lib;
  /** Safe unified try/catch execution for sync, async, and thenable functions. */
  readonly Try: t.Try.Lib;

  /**
   * Take unknown input and produce a standard error object.
   */
  std(input: t.ErrorGeneratorInput, options?: t.ErrStdOptions | string): t.StdError;

  /**
   * Create a new error collection builder.
   */
  errors(): t.ErrorCollection;

  /**
   * Normalize arbitrary input into a native `Error` instance.
   *
   * - Returns `error` unchanged when already an `Error`.
   * - Lifts objects with a `message` field into an `Error` and copies enumerable fields.
   * - Falls back to `new Error(String(input))` for all other values.
   */
  normalize(input: unknown): Error;

  /**
   * Produce a clean, stable human-readable summary of an unknown error-like value.
   */
  summary(input: unknown, opts?: ErrSummaryOptions): string;
};

/** Options for the `Err.summary` method. */
export type ErrSummaryOptions = {
  stack?: boolean;
  cause?: boolean;
};
