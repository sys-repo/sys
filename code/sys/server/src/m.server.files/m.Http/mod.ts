import type { t } from '../common.ts';
import { manifest } from './m.manifest.ts';

/** HTTP projections for bounded Files backings. */
export const Http: t.FilesServer.Http.Lib = {
  manifest,
};
