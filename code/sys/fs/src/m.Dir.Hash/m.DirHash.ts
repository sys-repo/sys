import { HashFmt as Fmt, type t } from './common.ts';
import { compute } from './u.compute.ts';
import { verify } from './u.verify.ts';

/**
 * Tools for working hashes of a file-system directory.
 */
export const DirHash: t.Dir.Hash.Lib = Object.freeze({
  Fmt,
  compute,
  verify,
});
