import type { t } from './common.ts';
import { createLive, createWritableLive } from './m.live/mod.ts';
import { createReadonly } from './m.readonly.ts';
import { createWritable } from './m.writable.ts';

/** Filesystem-shaped backing adapters for the Files model. */
export const Fs: t.FilesFs.Lib = {
  Readonly: { create: createReadonly, live: createLive },
  Writable: { create: createWritable, live: createWritableLive },
};
