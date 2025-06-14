/**
 * @module
 * Tools for working with the JSR module registry (on the client).
 * https://jsr.io/docs
 */
import { Fetch } from './common.ts';
import type { JsrClientLib } from './t.ts';

export const Jsr: JsrClientLib = {
  Fetch,
  Url: Fetch.Url,
};
