/**
 * @module
 * Library for working with unique identifiers.
 *
 * @example
 * ```ts
 * import { Id } from '@sys/std/id';          // ← Utility library
 * import { cuid, slug } from '@sys/std/id';  // ← Standard generator functions.
 * ```
 */

import { Id } from './Id.ts';
export { Id };

/**
 * A CUID ← "Secure, collision-resistant id"
 * https://github.com/paralleldrive/cuid2
 */
export const cuid = Id.cuid;

/**
 * A compact collision resistent ID.
 * https://github.com/paralleldrive/cuid2
 */
export const slug = Id.slug;
