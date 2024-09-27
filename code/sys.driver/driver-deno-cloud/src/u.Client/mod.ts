/**
 * @module
 * DenoCloud: Client Tools.
 */

import type { t } from './common/mod.ts';
import { client } from './u.Client.ts';

export { Pkg } from './common/mod.ts';

/**
 * Client for working with a DenoCloud server HTTP endpoint.
 */
export const DenoCloud: t.DenoCloudClientLib = {
  client,
};
