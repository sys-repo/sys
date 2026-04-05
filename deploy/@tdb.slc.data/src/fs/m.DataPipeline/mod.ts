/**
 * @module
 * Filesystem-backed SLC data pipeline operations.
 */
import { type t } from './common.ts';
import { stageFolder } from './m.stageFolder.ts';
import { refreshRoot } from './u.refresh.ts';

export const SlcDataPipeline: t.SlcDataPipeline.Lib = {
  stageFolder,
  refreshRoot,
};
