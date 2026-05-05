import type { CellTmpl as TCellTmpl } from './t.ts';
import { bundleTmpl } from './-bundle/mod.ts';
import { makeTmpl } from './u/u.make.ts';
import { names } from './u/u.roots.ts';
import { readTmplText } from './u/u.text.ts';
export type * from './t.ts';

export const CellTmpl: TCellTmpl.Lib = {
  names,
  make: makeTmpl,
  text: readTmplText,
  bundle: bundleTmpl,
};

if (import.meta.main) {
  await CellTmpl.bundle();
}
