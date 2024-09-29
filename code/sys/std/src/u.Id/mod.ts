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
