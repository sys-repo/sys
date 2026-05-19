import type { t } from './common.ts';
import { fromDist } from './m.fromDist.ts';

/** Static backing adapters for the Files model. */
export const FilesStatic: t.FilesStatic.Lib = {
  fromDist,
};
