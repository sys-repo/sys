import { type t } from '../common.ts';
import { createLiveRuntime } from './u.runtime.ts';

/**
 * Create a bounded live Files backing from a structural filesystem watch capability.
 */
export const createLive: t.FilesFs.Lib['live'] = (options) => {
  return createLiveRuntime(options).backing;
};
