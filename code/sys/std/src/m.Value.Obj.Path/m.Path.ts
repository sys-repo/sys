import type { t } from './common.ts';

import { Mutate } from './m.Mutate.ts';
import { exists } from './m.Path.exists.ts';
import { get } from './m.Path.get.ts';

export const Path: t.ObjPathLib = {
  Mutate,
  mutate: Mutate.set,
  get,
  exists,
};
