import type { t } from './common.ts';

import { Curried } from './m.Curried.ts';
import { Mutate } from './m.Mutate.ts';
import { exists } from './m.Path.exists.ts';
import { get } from './m.Path.get.ts';

export const Path: t.ObjPathLib = {
  get,
  exists,
  Mutate,
  Curried,
  curry: Curried.create,
};
