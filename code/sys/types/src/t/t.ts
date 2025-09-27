/**
 * A response value from a function that is not used by the function
 * (allows for arbitrary return values signalling to the consumer
 * that whatever is returned will not be used.)
 */
export type IgnoredResult = unknown;

/**
 * Any kind of "non" response.
 * Example usage:
 *
 *    type F = (e: Args) => string | Nothing;
 */
export type Nothing = void | undefined | null;
