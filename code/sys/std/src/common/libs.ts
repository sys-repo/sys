import type { RLib } from './t.ts';

/**
 * @ext
 */
import {
  clamp,
  clone,
  equals,
  flatten,
  is,
  mergeDeepRight,
  prop,
  sort,
  sortBy,
  toString,
  uniq,
  uniqBy,
} from 'ramda';

/**
 * Ramda functional utilities.
 */
export const R: RLib = {
  clone,
  clamp,
  equals,
  mergeDeepRight,
  flatten,
  is,
  prop,
  sort,
  sortBy,
  toString,
  uniq,
  uniqBy,
};
