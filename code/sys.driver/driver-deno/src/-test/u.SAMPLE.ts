import { type t, Fs, slug, Testing } from './common.ts';
import * as sample1 from './sample-1/mod.ts';

export const SAMPLE = {
  sample1,
  fs: Testing.dir,
} as const;
