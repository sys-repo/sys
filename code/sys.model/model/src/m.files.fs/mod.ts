/**
 * @module
 * Filesystem-shaped backing adapters for the Files model.
 */
import type { t } from './common.ts';
import { createLive } from './m.live/mod.ts';
import { createReadonly } from './m.readonly.ts';

export type * from './t.ts';

/**
 * Filesystem-shaped backing adapters for the Files model.
 */
export const FilesFs: t.FilesFs.Lib = {
  readonly: createReadonly,
  live: createLive,
};
