import { type t, HashFmt as Fmt } from './common.ts';
import { compute } from './u.compute.ts';
import { verify } from './u.verify.ts';

/**
 * Tools for working hashes of a file-system directory.
 */
export const DirHash: t.DirHash.Lib = {
  Fmt,
  compute,
  verify,
};
