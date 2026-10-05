/**
 * @module
 * Filesystem-shaped backing adapters for the Files model.
 */
import type { t } from './common.ts';
import { Files as FilesBase } from '../m.files/mod.ts';
import { Fs } from './m.Fs.ts';

export type * from './t.ts';

/**
 * Bounded Files model with filesystem-shaped backing adapters attached at `Files.Fs`.
 */
export const Files: t.FilesFs.FilesLib = {
  ...FilesBase,
  Fs,
};
