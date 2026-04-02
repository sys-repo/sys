/**
 * @module
 * Filesystem-backed SLC data pipeline operations.
 */
import { type t, Fs } from './common.ts';
import { stageFolder } from './m.stageFolder.ts';

void Fs;

export const SlcDataPipeline: t.SlcDataPipeline.Lib = {
  stageFolder,
};
