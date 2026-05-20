import { type t } from './common.ts';
import { writableCapabilities } from './u.capabilities.ts';
import { remove } from './u.cmd.remove.ts';
import { write } from './u.cmd.write.ts';
import { translate } from './u.error.ts';
import { type MemoryNodes } from './u.index.ts';
import { createBaseRuntime } from './u.runtime.base.ts';

/** Internal writable memory runtime; not exported from the public module. */
export const createWritableRuntime = (options: t.FilesMemory.Options = {}): WritableRuntime => {
  try {
    const base = createBaseRuntime(options);
    const capabilities = writableCapabilities(base.capabilities);

    return Object.freeze({
      nodes: base.nodes,
      backing: {
        kind: 'files/memory:writable',
        policy: base.policy,
        capabilities,
        handlers: Object.freeze({
          ...base.handlers,
          'files:capabilities': () => capabilities,
          'files:manifest': async (
            payload: t.FilesCmd.Manifest.Payload,
            context: t.Cmd.Handler.Context<
              t.FilesCmd.Name,
              t.FilesCmd.Event,
              t.FilesCmd.Name.Manifest
            >,
          ) => {
            const manifest = await base.handlers['files:manifest'](payload, context);
            return { ...manifest, capabilities };
          },
          'files:write': (payload: t.FilesCmd.Write.Payload) => {
            return write(base.nodes, base.policy, payload);
          },
          'files:remove': (payload: t.FilesCmd.Remove.Payload) => {
            return remove(base.nodes, base.policy, payload).result;
          },
        }),
      },
    });
  } catch (error) {
    throw translate(error);
  }
};

export type WritableRuntime = {
  readonly nodes: MemoryNodes;
  readonly backing: t.FilesMemory.Writable;
};
