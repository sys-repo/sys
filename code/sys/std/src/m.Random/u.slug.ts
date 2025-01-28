import { type t, Length } from './common.ts';
import { base36 } from './u.base36.ts';

/**
 * Generate a non-sequental identifier.
 * IMPORTANT
 *    DO NOT put "slugs" into databases as keys.
 *    Use the longer "cuid" for that.
 */
export const slug: t.RandomLib['slug'] = () => base36(Length.slug);
