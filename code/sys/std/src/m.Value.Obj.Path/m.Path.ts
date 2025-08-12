import type { t } from './common.ts';

import { CurriedPath } from './m.CurriedPath.ts';
import { Mutate } from './m.Mutate.ts';
import { exists } from './m.Path.exists.ts';
import { get } from './m.Path.get.ts';
import { Codec } from './m.Codec.ts';

export const Path: t.ObjPathLib = {
  Mutate,
  Codec,
  get,
  exists,
  curry: CurriedPath.create,
};
