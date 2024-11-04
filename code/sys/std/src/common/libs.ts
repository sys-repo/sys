import type * as t from './t.ts';

/**
 * @ext
 */
import { equals, is, mergeDeepRight, prop, sortBy, toString, uniq, uniqBy } from 'rambda';
import { clone } from 'ramda'; // NB: clone from "rambda" causes errors on circular-references.

/**
 * Ramda functional utilities.
 */
export const R: t.RLib = {
  clone,
  equals,
  mergeDeepRight,
  is,
  prop,
  sortBy,
  toString,
  uniq,
  uniqBy,
};
