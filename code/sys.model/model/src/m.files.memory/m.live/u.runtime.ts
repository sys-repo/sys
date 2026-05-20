import { type t } from '../common.ts';
import { authorityHandlerOptions } from '../u/u.authority.ts';
import { translate } from '../u/u.error.ts';
import { createRuntimeCore } from '../u/u.runtime.base.ts';
import { createWritableMutations } from '../u/u.writable.ts';
import { createWatch } from './u.watch.ts';

type LiveRuntime = {
  readonly backing: t.FilesMemory.Live;
};

/** Internal live memory runtime; not exported from the public module. */
export const createLiveRuntime = (options: t.FilesMemory.Options = {}): LiveRuntime => {
  try {
    const core = createRuntimeCore('live', options);
    const mutations = createWritableMutations(core.nodes, core.policy);
    const watch = createWatch(core.nodes, core.policy);
    const liveHandlers = Object.freeze({
      ...core.baseHandlers,
      'files:write': (payload: t.FilesCmd.Write.Payload) => {
        const result = mutations.write(payload);
        const change = watch.emit(result.kind, result.path);
        return withSeq(result, change);
      },
      'files:remove': (payload: t.FilesCmd.Remove.Payload) => {
        const mutation = mutations.remove(payload);
        let rootChange: t.Files.Change | undefined;
        for (const path of mutation.deleted) {
          const change = watch.emit('deleted', path);
          if (path === mutation.result.path) rootChange = change;
        }
        return withSeq(mutation.result, rootChange);
      },
      'files:watch': watch.handler,
    });

    return Object.freeze({
      backing: {
        kind: 'files/memory:live',
        policy: core.policy,
        capabilities: core.capabilities,
        handlers: core.authority.handlers(liveHandlers, authorityHandlerOptions),
        diagnostics: watch.diagnostics,
      },
    });
  } catch (error) {
    throw translate(error);
  }
};

function withSeq<R extends t.FilesCmd.Write.Result | t.FilesCmd.Remove.Result>(
  result: R,
  change: t.Files.Change | undefined,
): R {
  return {
    ...result,
    ...(change?.seq === undefined ? {} : { seq: change.seq }),
  };
}
