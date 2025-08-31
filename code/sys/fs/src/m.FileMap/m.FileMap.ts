import { type t } from './common.ts';

import { Data } from './m.Data.ts';
import { Is } from './m.Is.ts';
import { toMap } from './u.toMap.ts';
import { materialize } from './u.materlialize.ts';
import { validate } from './u.validate.ts';
import { write } from './u.write.ts';
import { bundle } from './u.bundle.ts';

export const FileMap: t.FileMapLib = {
  Is,
  Data,
  toMap,
  write,
  bundle,
  validate,
  materialize,
};
