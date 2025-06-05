import type { VitepressTmplLib } from './t.ts';

import { Bundle } from './m.Bundle.ts';
import { create } from './u.create.ts';
import { prep } from './u.prep.ts';
import { write } from './u.write.ts';

export const VitepressTmpl: VitepressTmplLib = {
  Bundle,
  prep,
  create,
  write,
};
