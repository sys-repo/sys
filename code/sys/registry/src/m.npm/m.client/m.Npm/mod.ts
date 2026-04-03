/**
 * @module
 * Tools for working with the npm registry (on the client).
 */
import { Is } from '../m.Is/mod.ts';
import { Import } from '../m.Import/mod.ts';
import { type t, Fetch } from './common.ts';

/** Client-side registry helper. */
export const Npm: t.NpmClientLib = {
  Fetch,
  Is,
  Import,
  Url: Fetch.Url,
};
