import { type t } from './common.ts';
import { create } from './m.Tmpl.create.ts';
import { Bundle } from './m.Bundle.ts';
import { update } from './m.Tmpl.update.ts';

export const VitepressTmpl: t.VitepressTmplLib = {
  Bundle,
  create,
  update,
};
