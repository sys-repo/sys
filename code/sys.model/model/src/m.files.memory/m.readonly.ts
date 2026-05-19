import { FilesFs } from '../m.files.fs/mod.ts';
import { type t } from './common.ts';
import { translate } from './u.error.ts';
import { memoryFs } from './u.fs.ts';
import { handlers } from './u.handlers.ts';

/**
 * Create a bounded readonly Files backing from an in-memory file map.
 */
export const createReadonly: t.FilesMemory.Lib['readonly'] = (options = {}) => {
  try {
    const { fs, root } = memoryFs(options);
    const backing = FilesFs.readonly({
      fs,
      root,
      ...(options.policy === undefined ? {} : { policy: options.policy }),
      ...(options.maxReadBytes === undefined ? {} : { maxReadBytes: options.maxReadBytes }),
      ...(options.defaultLimit === undefined ? {} : { defaultLimit: options.defaultLimit }),
    });
    const capabilities = Object.freeze(
      {
        ...backing.capabilities,
        fidelity: 'snapshot',
      } satisfies t.Files.Capabilities,
    );

    return {
      kind: 'files/memory:readonly',
      policy: backing.policy,
      capabilities,
      handlers: handlers(backing.handlers, capabilities),
    };
  } catch (error) {
    throw translate(error);
  }
};
