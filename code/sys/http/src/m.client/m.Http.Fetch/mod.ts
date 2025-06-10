/**
 * @module
 * Helpers for working with the native `fetch` function.
 * https://fetch.spec.whatwg.org/
 */
import type { HttpFetchLib } from './t.ts';
import { create } from './u.create.ts';

export const Fetch: HttpFetchLib = {
  create,
};
