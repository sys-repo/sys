import type * as t from './t.ts';

/**
 * @ext
 */
import { equals, mergeDeepRight, prop, sortBy, toString, uniq, uniqBy } from 'rambda';
import { clone } from 'ramda'; // NB: clone from "rambda" causes errors on circular-references.

/**
 * Ramda functional utilities.
 */
export const R: t.RLib = {
  clone,
  equals,
  mergeDeepRight,
  prop,
  sortBy,
  toString,
  uniq,
  uniqBy,
};
