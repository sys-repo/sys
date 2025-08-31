import { Log } from '../m.log/mod.ts';
import { type t, c, FileMap, Fs, Path } from './common.ts';
import { bundle } from './u.bundle.ts';
import { makeWriter } from './u.write.ts';

/** Kernel constructor: host injects loader + optional per-run processor. */
export const makeTmpl: t.MakeTmplFunction = (args: t.TmplMakeArgs): t.TmplKernel => {
  return {
    bundle,
    write: makeWriter(args),
    table: Log.table,
  };
};
