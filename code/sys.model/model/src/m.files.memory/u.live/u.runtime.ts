import { type t } from '../common.ts';
import { FilesFs } from '../../m.files.fs/mod.ts';
import { translate } from '../u.error.ts';
import { memoryFs } from '../u.fs.ts';
import { handlers } from '../u.handlers.ts';
import { createLiveDriver, type LiveDriver } from './u.driver.ts';
import { createWatch } from './u.watch.ts';

/** Internal live memory runtime; not exported from the public module. */
export const createLiveRuntime = (options: t.FilesMemory.Options = {}): LiveRuntime => {
  try {
    const { fs, root, nodes } = memoryFs(options);
    const backing = FilesFs.readonly({
      fs,
      root,
      ...(options.policy === undefined ? {} : { policy: options.policy }),
      ...(options.maxReadBytes === undefined ? {} : { maxReadBytes: options.maxReadBytes }),
      ...(options.defaultLimit === undefined ? {} : { defaultLimit: options.defaultLimit }),
    });
    const capabilities = Object.freeze(
      {
        ...backing.capabilities,
        fidelity: 'live',
        watch: true,
      } satisfies t.Files.Capabilities,
    );
    const watch = createWatch(nodes, backing.policy);
    const driver = createLiveDriver(nodes, watch.emit);
    const base = handlers(backing.handlers, capabilities);

    return Object.freeze({
      backing: {
        kind: 'files/memory:live',
        policy: backing.policy,
        capabilities,
        handlers: Object.freeze({
          ...base,
          'files:watch': watch.handler,
        }),
        diagnostics: watch.diagnostics,
      },
      driver,
    });
  } catch (error) {
    throw translate(error);
  }
};

/** Owner-only deterministic runtime; delete when Files write/remove commands exist. */
export type LiveRuntime = {
  readonly backing: t.FilesMemory.Live;
  readonly driver: LiveDriver;
};
