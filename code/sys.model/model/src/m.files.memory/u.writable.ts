import { type t } from './common.ts';
import { writableCapabilities } from './u.capabilities.ts';
import { remove, type RemoveMutation } from './u.cmd/u.cmd.remove.ts';
import { write } from './u.cmd/u.cmd.write.ts';
import { translate } from './u.error.ts';
import { type MemoryNodes } from './u.index.ts';
import { createBaseRuntime } from './u.runtime.base.ts';
import { withCapabilities } from '../m.files/u.handlers.ts';

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
          ...withCapabilities(base.handlers, capabilities),
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
