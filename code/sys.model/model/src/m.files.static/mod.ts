/**
 * @module
 * Static dist.json backing adapter for the Files model.
 */
import type { t } from './common.ts';
import { fromDist } from './m.fromDist.ts';

export type * from './t.ts';

/** Static backing adapters for the Files model. */
export const FilesStatic: t.FilesStatic.Lib = {
  fromDist,
};
