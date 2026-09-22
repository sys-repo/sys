import { Pkg } from '@sys/std/pkg';
import type { t } from './common.ts';
import { checkSelfReported } from './u/u.checkSelfReported.ts';
import { compute } from './u/u.compute.ts';
import { load } from './u/u.load.ts';
import { Local } from './m.Local.ts';
import { Log } from './m.Log.ts';
import { Pinned } from './m.Pinned.ts';
import { Pins } from './m.Pins.ts';
import { project } from './u/u.project.ts';

/**
 * Filesystem tools for distribution metadata and integrity.
 */
export const Dist: t.Pkg.Dist.Lib = Object.freeze({
  ...Pkg.Dist,
  Log,
  Local,
  Pinned,
  Pins,
  project,
  compute,
  load,
  checkSelfReported,
});
