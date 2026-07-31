/**
 * @module
 * Public filesystem contracts.
 */
import type { t } from './common.ts';

/** Filter files during a copy operation. */
export type FsCopyFilter = (args: t.FsCopyFilterArgs) => boolean;
export type FsCopyFilterArgs = {
  source: t.StringAbsolutePath;
  target: t.StringAbsolutePath;
};

/** Public module contracts. */
export type * from './m.Dir/t.ts';
export type * from './m.Env/t.ts';
export type * from './m.FileMap/t.ts';
export type * from './m.Fs.capability/t.ts';
export type * from './m.Fs/t.ts';
export type * from './m.Glob/t.ts';
export type * from './m.JsonFile/t.ts';
export type * from './m.Path/t.ts';
export type * from './m.Pkg/t.ts';
export type * from './m.Watch/t.ts';
export type * from './m.Fs.capability/m.Rooted/t.ts';
