import { type t } from './common.ts';
import { createBaseRuntime } from './u/u.runtime.base.ts';

/**
 * Create a bounded readonly Files backing from a structural filesystem capability.
 */
export const createReadonly: t.FilesFs.ReadonlyLib['create'] = (options) => {
  const base = createBaseRuntime(options);

  return {
    kind: 'files/fs:readonly',
    policy: base.policy,
    capabilities: base.capabilities,
    handlers: base.handlers,
  };
};
