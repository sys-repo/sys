/**
 * Client tools for interacting with the Deno cloud.
 * @module
 *
 * @example
 * ```ts
 * import { DenoCloud } from '@sys/driver-deno/cloud/client';
 * ```
 */
import type { DenoCloudClientLib } from './t.ts';
import { client } from './u.Client.ts';

/**
 * Client for working with a DenoCloud server HTTP endpoint.
 */
export const DenoCloud: DenoCloudClientLib = {
  client,
};
