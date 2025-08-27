import type { ViteTmplLib } from './t.ts';

import { Bundle } from './m.Bundle.ts';
import { create } from './u.create.ts';
import { prep } from './u.prep.ts';
import { write } from './u.write.ts';

export const ViteTmpl: ViteTmplLib = {
  Bundle,
  prep,
  create,
  write,
};
