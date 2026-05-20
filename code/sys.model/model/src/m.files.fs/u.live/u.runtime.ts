import { type t } from '../common.ts';
import { liveCapabilities } from '../u.capabilities.ts';
import { createBaseRuntime } from '../u.runtime.base.ts';
import { withCapabilities } from '../../m.files/u.handlers.ts';
import { createWatch } from './u.watch.ts';

type LiveRuntime = {
  readonly backing: t.FilesFs.Live;
};

/** Internal live files/fs runtime; not exported from the public module. */
export const createLiveRuntime = (options: t.FilesFs.LiveOptions): LiveRuntime => {
  const base = createBaseRuntime(options);
  const capabilities = liveCapabilities(base.capabilities);
  const watch = createWatch(base.scope, base.policy);

  return Object.freeze({
    backing: {
      kind: 'files/fs:live',
      policy: base.policy,
      capabilities,
      handlers: Object.freeze({
        ...withCapabilities(base.handlers, capabilities),
        'files:watch': watch.handler,
      }),
      diagnostics: watch.diagnostics,
    },
  });
};
