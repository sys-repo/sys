import type { DirHashLib } from './t.ts';

import { HashFmt as Fmt } from './common.ts';
import { compute } from './u.compute.ts';
import { verify } from './u.verify.ts';

/**
 * Tools for working hashes of a file-system directory.
 */
export const DirHash: DirHashLib = {
  Fmt,
  compute,
  verify,
};
