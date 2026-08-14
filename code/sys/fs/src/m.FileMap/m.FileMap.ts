import type { t } from './common.ts';

import { Data } from './m.Data.ts';
import { Is } from './m.Is.ts';
import { bundle } from './u/u.bundle.ts';
import { filter } from './u/u.filter.ts';
import { toMap } from './u/u.toMap.ts';
import { validate } from './u/u.validate.ts';
import { write } from './u/u.write.ts';

/** FileMap conversion, validation, filtering, and materialization helpers. */
export const FileMap: t.FileMap.Lib = Object.freeze({
  Is,
  Data,
  toMap,
  bundle,
  validate,
  filter,
  write,
});
