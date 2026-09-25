import type { t } from '../common.ts';
import { CELL_GAP, create } from './u.create.ts';
import { pairs } from './u.pairs.ts';

/**
 * Tools for working with CLI tables.
 */
export const Table: t.CliTable.Lib = Object.freeze({
  cellGap: CELL_GAP,
  create,
  pairs,
});
