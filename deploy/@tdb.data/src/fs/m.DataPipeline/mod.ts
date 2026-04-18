/**
 * @module
 * Filesystem-backed staged-data pipeline operations.
 */
import { type t } from './common.ts';
import { stageSlugDataset } from './m.stageSlugDataset.ts';
import { stageFolder } from './m.stageFolder.ts';
import { refreshRoot } from './u.refresh.ts';

export const SlugDataPipeline: t.SlugDataPipeline.Lib = {
  stageSlugDataset,
  stageFolder,
  refreshRoot,
};
