import { type t } from './common.ts';
import { DirHashLog as Log } from './m.Log.ts';
import { compute } from './u.compute.ts';
import { verify } from './u.verify.ts';

/**
 * Tools for working hashes of a file-system directory.
 */
export const DirHash: t.DirHashLib = {
  Log,
  compute,
  verify,
};
