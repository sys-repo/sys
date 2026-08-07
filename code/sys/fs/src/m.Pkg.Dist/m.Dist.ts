import { Pkg } from '@sys/std/pkg';
import { type t } from './common.ts';
import { checkSelfReported } from './u/u.checkSelfReported.ts';
import { compute } from './u/u.compute.ts';
import { load } from './u/u.load.ts';
import { Local } from './m.Local.ts';
import { Log } from './m.Log.ts';
import { Pinned } from './m.Pinned.ts';

/** Filesystem operations for distribution-package metadata. */
export const Dist: t.Pkg.Dist.Lib = {
  ...Pkg.Dist,
  Log,
  Local,
  Pinned,
  compute,
  load,
  checkSelfReported,
};
