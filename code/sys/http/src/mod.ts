/**
 * @module
 * Tools for working with HTTP.
 *
 * @example
 * ```ts
 * import { pkg } from '@sys/http';
 * import { Http } from '@sys/http/client';
 *
 * const a = Http.Client.create({ accessToken: 'my-jwt' });
 * const b = Http.client();  // ← shorthand.
 * ```
 */
export { pkg } from './pkg.ts';

/** Module types. */
export type * as t from './types.ts';
