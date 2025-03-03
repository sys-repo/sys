import type { t } from './common.ts';
import { Bundle } from './m.Bundle.ts';
import { create } from './u.create.ts';
import { prep } from './u.prep.ts';
import { write } from './u.write.ts';

export const ViteTmpl: t.ViteTmplLib = {
  Bundle,
  prep,
  create,
  write,
};
