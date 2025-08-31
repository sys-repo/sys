import { type t } from './common.ts';

import { Data } from './m.Data.ts';
import { Is } from './m.Is.ts';
import { bundle } from './u.bundle.ts';
import { materialize } from './u.materlialize.ts';
import { toMap } from './u.toMap.ts';
import { validate } from './u.validate.ts';

export const FileMap: t.FileMapLib = {
  Is,
  Data,
  toMap,
  bundle,
  validate,
  materialize,
};
