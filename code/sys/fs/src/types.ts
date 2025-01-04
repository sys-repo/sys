import type { t } from './common.ts';

/**
 * @module
 * Module types.
 */
export type * from './m.Pkg/t.ts';
export type * from './m.Dir.Hash/t.ts';
export type * from './m.Dir/t.ts';
export type * from './m.FileMap/t.ts';
export type * from './m.Fs/t.ts';
export type * from './m.Glob/t.ts';
export type * from './m.Path/t.ts';
export type * from './m.Watch/t.ts';

/** Filter files during a copy operation. */
export type FsCopyFilter = (args: t.FsCopyFilterArgs) => boolean;
export type FsCopyFilterArgs = {
  source: t.StringPath;
  target: t.StringPath;
};

/** Filters on an absolute path. */
export type FsPathFilter = (path: t.StringAbsolutePath) => boolean;
