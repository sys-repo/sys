/**
 * @module
 * Client tools for interacting with the Deno cloud.
 *
 * @example
 * ```ts
 * import { DenoCloud } from '@sys/driver-deno/cloud/client';
 * ```
 */
import type { t } from './common.ts';
import { client } from './u.Client.ts';

/**
 * Client for working with a DenoCloud server HTTP endpoint.
 */
export const DenoCloud: t.DenoCloudClientLib = {
  client,
};
