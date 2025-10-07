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
