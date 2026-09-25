import { type t } from '../common.ts';
import { remove, type RemoveMutation } from '../u.cmd/u.cmd.remove.ts';
import { write } from '../u.cmd/u.cmd.write.ts';
import { authorityHandlerOptions } from './u.authority.ts';
import { translate } from './u.error.ts';
import { type MemoryNodes } from './u.index.ts';
import { createRuntimeCore } from './u.runtime.base.ts';

type WritableRuntime = {
  readonly nodes: MemoryNodes;
  readonly mutations: WritableMutations;
  readonly backing: t.FilesMemory.Writable;
};

export type WritableMutations = {
  readonly write: (payload: t.Files.Cmd.Write.Payload) => t.Files.Cmd.Write.Result;
  readonly remove: (payload: t.Files.Cmd.Remove.Payload) => RemoveMutation;
};

/** Internal writable memory runtime; not exported from the public module. */
export const createWritableRuntime = (options: t.FilesMemory.Options = {}): WritableRuntime => {
  try {
    const core = createRuntimeCore('writable', options);
    const mutations = createWritableMutations(
      core.nodes,
      core.policy,
      core.capabilities.maxWriteBytes,
    );
    const writableHandlers = Object.freeze({
      ...core.baseHandlers,
      'files:write': mutations.write,
      'files:remove': (payload: t.Files.Cmd.Remove.Payload) => {
        return mutations.remove(payload).result;
      },
    });

    return Object.freeze({
      nodes: core.nodes,
      mutations,
      backing: {
        kind: 'files/memory:writable',
        policy: core.policy,
        capabilities: core.capabilities,
        handlers: core.authority.handlers(writableHandlers, authorityHandlerOptions),
      },
    });
  } catch (error) {
    throw translate(error);
  }
};

export const createWritableMutations = (
  nodes: MemoryNodes,
  policy: t.Files.Policy.Shape,
  maxWriteBytes?: t.NumberBytes,
): WritableMutations => {
  return Object.freeze({
    write: (payload) => write(nodes, policy, payload, maxWriteBytes),
    remove: (payload) => remove(nodes, policy, payload),
  });
};
