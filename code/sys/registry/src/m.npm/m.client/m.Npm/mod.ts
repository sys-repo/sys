/**
 * @module
 * Tools for working with the npm registry (on the client).
 */
import { Import } from '../m.Import/mod.ts';
import { type t, Fetch } from './common.ts';

/** Client-side registry helper. */
export const Npm: t.NpmClientLib = {
  Fetch,
  Import,
  Url: Fetch.Url,
};
