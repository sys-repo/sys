import type { t } from './common.ts';
import { client } from './u.Client.ts';

/**
 * Client for working with a DenoCloud server HTTP endpoint.
 */
export const DenoCloud: t.DenoCloudClientLib = {
  client,
};
