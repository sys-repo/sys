import { type t } from '../common.ts';
import { liveCapabilities } from '../u.capabilities.ts';
import { translate } from '../u.error.ts';
import { createWritableRuntime } from '../u.writable.ts';
import { withCapabilities } from '../../m.files/u.handlers.ts';
import { createWatch } from './u.watch.ts';

type LiveRuntime = {
  readonly backing: t.FilesMemory.Live;
};

/** Internal live memory runtime; not exported from the public module. */
export const createLiveRuntime = (options: t.FilesMemory.Options = {}): LiveRuntime => {
  try {
    const { backing: writable, mutations, nodes } = createWritableRuntime(options);
    const capabilities = liveCapabilities(writable.capabilities);
    const watch = createWatch(nodes, writable.policy);

    return Object.freeze({
      backing: {
        kind: 'files/memory:live',
        policy: writable.policy,
        capabilities,
        handlers: Object.freeze({
          ...withCapabilities(writable.handlers, capabilities),
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
        }),
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
