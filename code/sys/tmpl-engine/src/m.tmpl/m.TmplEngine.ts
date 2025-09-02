import { File } from '../m.file/mod.ts';
import { Log } from '../m.log/mod.ts';

import { type t, FileMap } from './common.ts';
import { makeTmpl } from './u.factory.ts';

/**
 * Library for copying template files.
 */
export const TmplEngine: t.TmplEngineLib = {
  Log,
  File,
  FileMap,
  makeTmpl,
  bundle: FileMap.bundle,
};
