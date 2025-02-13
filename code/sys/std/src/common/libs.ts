import type * as t from './t.ts';

/**
 * @ext
 */
import {
  clamp,
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
} from 'rambda';
import { clone } from 'ramda'; // NB: clone from "rambda" causes errors on circular-references.

/**
 * Ramda functional utilities.
 */
export const R: t.RLib = {
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

/**
 * Validation helpers ( https://valibot.dev )
 */
export * as V from 'valibot';
