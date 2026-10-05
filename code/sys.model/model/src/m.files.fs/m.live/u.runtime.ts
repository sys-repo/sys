import { type t } from '../common.ts';
import { authorityHandlerOptions } from '../u/u.authority.ts';
import { createRuntimeCore } from '../u/u.runtime.base.ts';
import { createWatch } from './u.watch.ts';

type LiveRuntime = {
  readonly backing: t.FilesFs.Live;
};

/** Internal live files/fs runtime; not exported from the public module. */
export const createLiveRuntime = (options: t.FilesFs.LiveOptions): LiveRuntime => {
  const core = createRuntimeCore('live', options);
  const watch = createWatch(core.scope, core.policy);
  const liveHandlers = Object.freeze({
    ...core.baseHandlers,
    'files:watch': watch.handler,
  });

  return Object.freeze({
    backing: {
      kind: 'files/fs:live',
      policy: core.policy,
      capabilities: core.capabilities,
      handlers: core.authority.handlers(liveHandlers, authorityHandlerOptions(core.scope.fs)),
      diagnostics: watch.diagnostics,
    },
  });
};
