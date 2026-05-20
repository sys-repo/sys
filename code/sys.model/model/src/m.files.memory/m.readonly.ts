import { type t } from './common.ts';
import { translate } from './u/u.error.ts';
import { createBaseRuntime } from './u/u.runtime.base.ts';

/**
 * Create a bounded readonly Files backing from an in-memory source tree.
 */
export const createReadonly: t.FilesMemory.ReadonlyLib['create'] = (options = {}) => {
  try {
    const base = createBaseRuntime(options);

    return {
      kind: 'files/memory:readonly',
      policy: base.policy,
      capabilities: base.capabilities,
      handlers: base.handlers,
    };
  } catch (error) {
    throw translate(error);
  }
};
