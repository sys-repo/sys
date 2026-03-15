import type { JsrFetch } from './t.ts';

import { JsrUrl as Url } from './common.ts';
import { Pkg } from './m.Fetch.Pkg.ts';

/**
 * Network fetching helpers against the "jsr.io" end-point.
 */
export const Fetch: JsrFetch.Lib = {
  Pkg,
  Url,
};
