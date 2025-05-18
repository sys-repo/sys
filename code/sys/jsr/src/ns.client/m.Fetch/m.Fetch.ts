import { type t, JsrUrl as Url } from './common.ts';
import { Pkg } from './m.Fetch.Pkg.ts';

/**
 * Network fetching helpers against the "jsr.io" end-point.
 */
export const Fetch: t.JsrFetchLib = {
  Pkg,
  Url,
};
