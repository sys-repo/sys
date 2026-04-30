import type { CellTmpl } from '../t.ts';

export const ROOTS = {
  default: 'cell.default',
} satisfies Record<CellTmpl.Name, string>;

export const names = Object.keys(ROOTS) as CellTmpl.Name[];
