import { bundleCellTmpl } from './u.bundle.ts';
import { makeCellTmpl, names } from './u.make.ts';
export type { CellTemplateName } from './u.make.ts';

export const CellTmpl = {
  names,
  make: makeCellTmpl,
  bundle: bundleCellTmpl,
} as const;

if (import.meta.main) {
  await CellTmpl.bundle();
}
