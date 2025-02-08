/**
 * @module
 * Tools for generating random values.
 */
import { type t, Length } from './common.ts';
import { base36 } from './u.base36.ts';
import { cuid } from './u.cuid.ts';
import { slug } from './u.slug.ts';

export { cuid, slug };

/**
 * Tools for generating random values.
 */
export const Random: t.RandomLib = {
  Length,
  base36,
  slug,
  cuid,
};
