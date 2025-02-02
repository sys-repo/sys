/**
 * @module
 * Tools for working with the JSR module registry (on the client).
 * https://jsr.io/docs
 */
import { type t, Fetch, Is } from './common.ts';

export const Jsr: t.JsrClientLib = {
  Is,
  Fetch,
};
