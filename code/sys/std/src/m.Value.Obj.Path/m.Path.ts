import type { t } from './common.ts';

import { Codec } from './m.Codec.ts';
import { asNumeric, decode, encode } from './m.Codec.u.ts';
import { CurriedPath } from './m.CurriedPath.ts';
import { Is } from './m.Is.ts';
import { Mutate } from './m.Mutate.ts';
import { eql } from './m.Path.eql.ts';
import { exists } from './m.Path.exists.ts';
import { get } from './m.Path.get.ts';
import { join } from './m.Path.join.ts';
import { normalize } from './m.Path.normalize.ts';
import { slice } from './m.Path.slice.ts';
import { Rel } from './m.Rel.ts';

export const Path: t.ObjPathLib = {
  Rel,
  Mutate,
  Is,

  get,
  exists,
  curry: CurriedPath.make,

  Codec,
  encode,
  decode,
  normalize,

  asNumeric,
  eql,
  join,
  slice,
};
