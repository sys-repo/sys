import { type t } from './common.ts';
import { createWritableRuntime } from './u/u.writable.ts';

/**
 * Create a bounded writable Files backing from a structural filesystem capability.
 */
export const createWritable: t.FilesFs.WritableLib['create'] = (options) => {
  return createWritableRuntime(options).backing;
};
