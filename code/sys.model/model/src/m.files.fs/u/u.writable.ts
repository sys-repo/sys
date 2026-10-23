import { type t } from '../common.ts';
import { remove, type RemoveMutation } from '../u.cmd/u.cmd.remove.ts';
import { type WritableScope, write } from '../u.cmd/u.cmd.write.ts';
import { authorityHandlerOptions } from './u.authority.ts';
import { createRuntimeCore } from './u.runtime.base.ts';

export type WritableRuntime = {
  readonly mutations: WritableMutations;
  readonly backing: t.FilesFs.Writable;
};

export type WritableMutations = {
  readonly write: (payload: t.Files.Cmd.Write.Payload) => Promise<t.Files.Cmd.Write.Result>;
  readonly remove: (payload: t.Files.Cmd.Remove.Payload) => Promise<RemoveMutation>;
};

/** Internal writable files/fs runtime; not exported from the public module. */
export const createWritableRuntime = (options: t.FilesFs.WritableOptions): WritableRuntime => {
  const core = createRuntimeCore('writable', options);
  const mutations = createWritableMutations(
    core.scope,
    core.policy,
    core.capabilities.maxWriteBytes,
  );
  const writableHandlers = Object.freeze({
    ...core.baseHandlers,
    'files:write': mutations.write,
    'files:remove': async (payload: t.Files.Cmd.Remove.Payload) => {
      return (await mutations.remove(payload)).result;
    },
  });

  return Object.freeze({
    mutations,
    backing: {
      kind: 'files/fs:writable',
      policy: core.policy,
      capabilities: core.capabilities,
      handlers: core.authority.handlers(writableHandlers, authorityHandlerOptions(core.scope.fs)),
    },
  });
};

export const createWritableMutations = (
  scope: WritableScope,
  policy: t.Files.Policy.Shape,
  maxWriteBytes?: t.NumberBytes,
): WritableMutations => {
  return Object.freeze({
    write: (payload) => write(scope, policy, payload, maxWriteBytes),
    remove: (payload) => remove(scope, policy, payload),
  });
};
