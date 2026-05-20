import { type t } from '../common.ts';
import { createLiveRuntime } from './u.runtime.ts';

/**
 * Create a bounded readonly+watch Files backing from a structural filesystem watch capability.
 */
export const createLive: t.FilesFs.ReadonlyLib['live'] = (options) => {
  return createLiveRuntime(options).backing;
};
