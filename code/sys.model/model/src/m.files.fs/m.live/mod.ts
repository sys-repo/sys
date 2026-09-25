import { type t } from '../common.ts';
import { createLiveRuntime } from './u.runtime.ts';
import { createWritableLiveRuntime } from './u.writable.runtime.ts';

/**
 * Create a bounded readonly+watch Files backing from a structural filesystem watch capability.
 */
export const createLive: t.FilesFs.ReadonlyLib['live'] = (options) => {
  return createLiveRuntime(options).backing;
};

/**
 * Create a bounded writable+watch Files backing from a structural filesystem watch capability.
 */
export const createWritableLive: t.FilesFs.WritableLib['live'] = (options) => {
  return createWritableLiveRuntime(options).backing;
};
