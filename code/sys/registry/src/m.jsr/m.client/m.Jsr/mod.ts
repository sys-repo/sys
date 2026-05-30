/**
 * @module
 * Tools for working with the JSR module registry (on the client).
 * https://jsr.io/docs
 */
import { Import } from '../m.Import/mod.ts';
import { Is } from '../m.Is/mod.ts';
import { Fetch, type t } from './common.ts';

/** Client-side registry helper. */
export const Jsr: t.JsrClient.Lib = {
  Fetch,
  Is,
  Import,
  Url: Fetch.Url,
};
