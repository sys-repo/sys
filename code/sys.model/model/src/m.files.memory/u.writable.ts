import { type t } from './common.ts';
import { writableCapabilities } from './u.capabilities.ts';
import { remove, type RemoveMutation } from './u.cmd.remove.ts';
import { write } from './u.cmd.write.ts';
import { translate } from './u.error.ts';
import { type MemoryNodes } from './u.index.ts';
import { createBaseRuntime } from './u.runtime.base.ts';

type WritableRuntime = {
  readonly nodes: MemoryNodes;
  readonly mutations: WritableMutations;
  readonly backing: t.FilesMemory.Writable;
};

type WritableMutations = {
  readonly write: (payload: t.FilesCmd.Write.Payload) => t.FilesCmd.Write.Result;
  readonly remove: (payload: t.FilesCmd.Remove.Payload) => RemoveMutation;
};

/** Internal writable memory runtime; not exported from the public module. */
export const createWritableRuntime = (options: t.FilesMemory.Options = {}): WritableRuntime => {
  try {
    const base = createBaseRuntime(options);
    const capabilities = writableCapabilities(base.capabilities);
    const mutations = writableMutations(base.nodes, base.policy);

    return Object.freeze({
      nodes: base.nodes,
      mutations,
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
          'files:write': mutations.write,
          'files:remove': (payload: t.FilesCmd.Remove.Payload) => {
            return mutations.remove(payload).result;
          },
        }),
      },
    });
  } catch (error) {
    throw translate(error);
  }
};

const writableMutations = (
  nodes: MemoryNodes,
  policy: t.FilesPolicy.Shape,
): WritableMutations => {
  return Object.freeze({
    write: (payload) => write(nodes, policy, payload),
    remove: (payload) => remove(nodes, policy, payload),
  });
};
