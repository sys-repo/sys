/**
 * @module
 * Tools for working with HTTP.
 *
 * @example
 * ```ts
 * import { pkg } from 'jsr:@sys/http';
 * import { Http } from 'jsr:@sys/http/client';
 *
 * const a = Http.Client.create({ accessToken: 'my-jwt' });
 * const b = Http.client();  // ← shorthand.
 * ```
 */
export { pkg } from './pkg.ts';

/** Module types. */
export type * as t from './types.ts';

/**
 * Library
 */
export { Http, Fetch } from './ns.client/m.Http/mod.ts';
