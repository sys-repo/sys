/**
 * @module
 * Tools for working with the npm registry (on the client).
 */
import { Is } from '../m.Is/mod.ts';
import { Import } from '../m.Import/mod.ts';
import { Fetch, type t } from './common.ts';

/** Client-side registry helper. */
export const Npm: t.NpmClient.Lib = Object.freeze({
  Fetch,
  Is,
  Import,
  Url: Fetch.Url,
});
