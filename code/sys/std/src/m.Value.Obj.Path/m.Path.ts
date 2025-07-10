import type { t } from './common.ts';

import { CurriedPath } from './m.CurriedPath.ts';
import { Mutate } from './m.Mutate.ts';
import { exists } from './m.Path.exists.ts';
import { get } from './m.Path.get.ts';

export const Path: t.ObjPathLib = {
  get,
  exists,
  Mutate,
  curry: CurriedPath.create,
};
