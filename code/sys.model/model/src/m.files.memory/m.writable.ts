import { type t } from './common.ts';
import { createWritableRuntime } from './u/u.writable.ts';

/**
 * Create a bounded writable Files backing from an in-memory source tree.
 */
export const createWritable: t.FilesMemory.WritableLib['create'] = (options = {}) => {
  return createWritableRuntime(options).backing;
};
