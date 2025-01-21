import type { t } from './common.ts';
import { Pkg } from './m.Fetch.Pkg.ts';
import { Url } from './m.Url.ts';

/**
 * Network fetching helpers against the "jsr.io" end-point.
 */
export const Fetch: t.JsrFetchLib = { Pkg, Url };
