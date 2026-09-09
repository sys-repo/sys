import { type t } from '../common.ts';
import { createLiveRuntime } from './u.runtime.ts';

/**
 * Create a bounded live Files backing from an in-memory source tree.
 */
export const createLive: t.FilesMemory.WritableLib['live'] = (options = {}) => {
  return createLiveRuntime(options).backing;
};
