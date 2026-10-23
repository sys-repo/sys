import { File } from '../m.file/mod.ts';
import { Log } from '../m.log/mod.ts';

import { FileMap, type t } from './common.ts';
import { makeTmpl } from './u.factory.ts';

/**
 * Library for copying template files.
 */
export const TmplEngine: t.TmplEngineLib = Object.freeze({
  Log,
  File,
  FileMap,
  makeTmpl,
  bundle: FileMap.bundle,
});
