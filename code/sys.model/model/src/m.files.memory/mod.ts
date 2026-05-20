/**
 * @module
 * In-memory backing adapters for the Files model.
 */
import type { t } from './common.ts';
import { createLive } from './m.live.ts';
import { createReadonly } from './m.readonly.ts';
import { createWritable } from './m.writable.ts';

export type * from './t.ts';

/**
 * In-memory backing adapters for the Files model.
 */
export const FilesMemory: t.FilesMemory.Lib = {
  readonly: createReadonly,
  writable: createWritable,
  live: createLive,
};
