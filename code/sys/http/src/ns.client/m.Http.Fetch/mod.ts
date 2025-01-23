/**
 * @module
 * Helpers for working with the native `fetch` function.
 * https://fetch.spec.whatwg.org/
 */
import type { t } from './common.ts';
import { create } from './u.create.ts';

export const Fetch: t.HttpFetchLib = {
  create,
};
