import type { t } from './common.ts';

import { Codec } from './m.Codec.ts';
import { CurriedPath } from './m.CurriedPath.ts';
import { Mutate } from './m.Mutate.ts';
import { exists } from './m.Path.exists.ts';
import { get } from './m.Path.get.ts';

export const Path: t.ObjPathLib = {
  Mutate,

  get,
  exists,
  curry: CurriedPath.create,

  Codec,
  codec: Codec.default,
  encode: Codec.default.encode,
  decode: Codec.default.decode,
};
