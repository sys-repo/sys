import { type t } from './common.ts';

import { Data } from './m.Data.ts';
import { Is } from './m.Is.ts';
import { bundle } from './u.bundle.ts';
import { materialize } from './u.materlialize.ts';
import { validate } from './u.validate.ts';
import { write } from './u.write.ts';

export const FileMap: t.FileMapLib = {
  Is,
  Data,
  bundle,
  write,
  validate,
  materialize,
};
