import type { t } from './common.ts';
import { Bundle } from './m.Bundle.ts';
import { create } from './m.Tmpl.create.ts';
import { update } from './m.Tmpl.update.ts';

export const ViteTmpl: t.ViteTmplLib = {
  Bundle,
  create,
  update,
};
