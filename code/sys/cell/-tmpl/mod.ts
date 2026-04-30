import { bundleCellTmpl } from './u/u.bundle.ts';
import { makeCellTmpl } from './u/u.make.ts';
import { names } from './u/u.roots.ts';
import { readCellTmplText } from './u/u.text.ts';
export type { CellTemplateName } from './u/u.roots.ts';

export const CellTmpl = {
  names,
  make: makeCellTmpl,
  text: readCellTmplText,
  bundle: bundleCellTmpl,
} as const;

if (import.meta.main) {
  await CellTmpl.bundle();
}
