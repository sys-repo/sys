/**
 * @module
 * Filesystem-backed SLC data pipeline operations.
 */
import { type t } from './common.ts';
import { stageAuthoredYaml } from './m.stageAuthoredYaml.ts';
import { stageFolder } from './m.stageFolder.ts';
import { refreshRoot } from './u.refresh.ts';

export const SlcDataPipeline: t.SlcDataPipeline.Lib = {
  stageAuthoredYaml,
  stageFolder,
  refreshRoot,
};
