import type { t } from '../common.ts';
import { toLive } from './m.Files.toLive.ts';
import { toLiveWritable } from './m.Files.toLiveWritable.ts';
import { toReadonly } from './m.Files.toReadonly.ts';
import { toWritable } from './m.Files.toWritable.ts';

/** Files-model capability adapters grouped by authority axis. */
export const Files: t.FsCapability.Files.Lib = Object.freeze({
  Readonly: Object.freeze({ create: toReadonly, live: toLive }),
  Writable: Object.freeze({ create: toWritable, live: toLiveWritable }),
});
