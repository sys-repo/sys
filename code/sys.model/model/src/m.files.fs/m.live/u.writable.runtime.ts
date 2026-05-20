import { type t } from '../common.ts';
import { authorityHandlerOptions } from '../u/u.authority.ts';
import { createWritableMutations } from '../u/u.writable.ts';
import { createRuntimeCore } from '../u/u.runtime.base.ts';
import { createWatch } from './u.watch.ts';

type WritableLiveRuntime = {
  readonly backing: t.FilesFs.WritableLive;
};

/** Internal writable+live files/fs runtime; not exported from the public module. */
export const createWritableLiveRuntime = (
  options: t.FilesFs.WritableLiveOptions,
): WritableLiveRuntime => {
  const core = createRuntimeCore('writable-live', options);
  const mutations = createWritableMutations(
    core.scope,
    core.policy,
    core.capabilities.maxWriteBytes,
  );
  const watch = createWatch(core.scope, core.policy);
  const liveHandlers = Object.freeze({
    ...core.baseHandlers,
    'files:write': async (
      payload: t.FilesCmd.Write.Payload,
      context: t.Cmd.Handler.Context<
        t.FilesCmd.Name,
        t.FilesCmd.Event,
        t.FilesCmd.Name.Write
      >,
    ) => {
      const result = await mutations.write(payload);
      const change = await watch.emit(result.kind, result.path, context.id);
      return withSeq(result, change, context.id);
    },
    'files:remove': async (
      payload: t.FilesCmd.Remove.Payload,
      context: t.Cmd.Handler.Context<
        t.FilesCmd.Name,
        t.FilesCmd.Event,
        t.FilesCmd.Name.Remove
      >,
    ) => {
      const mutation = await mutations.remove(payload);
      let rootChange: t.Files.Change | undefined;
      for (const path of mutation.deleted) {
        const change = await watch.emit('deleted', path, context.id);
        if (path === mutation.result.path) rootChange = change;
      }
      return withSeq(mutation.result, rootChange, context.id);
    },
    'files:watch': watch.handler,
  });

  return Object.freeze({
    backing: {
      kind: 'files/fs:writable-live',
      policy: core.policy,
      capabilities: core.capabilities,
      handlers: core.authority.handlers(liveHandlers, authorityHandlerOptions(core.scope.fs)),
      diagnostics: watch.diagnostics,
    },
  });
};

function withSeq<R extends t.FilesCmd.Write.Result | t.FilesCmd.Remove.Result>(
  result: R,
  change: t.Files.Change | undefined,
  correlation: t.Cmd.ReqId,
): R {
  return {
    ...result,
    correlation,
    ...(change?.seq === undefined ? {} : { seq: change.seq }),
  };
}
