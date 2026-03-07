/**
 * An object that looks like a simple Error object
 * in that it contains a "message" string.
 */
export type ErrorLike = { readonly message: string };

/**
 * A simple serializable object that conforms to the shape of
 * a standard javascript [Error] object.
 */
export type StdError = ErrorLike & {
  readonly name: string;
  readonly cause?: StdError;
  readonly errors?: StdError[];
};

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

/** Discriminated union representing the outcome of a Try.run call. */
export type TryResult<T> = TryOk<T> | TryFail;
