/**
 * @module
 * Tools for working with the JSR module registry (on the client).
 * https://jsr.io/docs
 */
import { Import } from '../m.Import/mod.ts';
import { type t, Fetch } from './common.ts';

/** Client-side registry helper. */
export const Jsr: t.JsrClientLib = {
  Fetch,
  Import,
  Url: Fetch.Url,
};
