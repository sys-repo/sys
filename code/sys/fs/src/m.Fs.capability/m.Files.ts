import { type t } from './common.ts';
import { toLive } from './m.Files.toLive.ts';
import { toReadonly } from './m.Files.toReadonly.ts';

/** Files-model capability adapters. */
export const Files: t.FsCapability.Files.Lib = {
  toReadonly,
  toLive,
};
