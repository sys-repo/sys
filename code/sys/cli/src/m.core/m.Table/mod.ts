import { Table as CliffyTable } from '@cliffy/table';
import type { t } from '../common.ts';

const CELL_GAP = 3;

/**
 * Tools for working with CLI tables.
 */
export const Table: t.CliTable.Lib = Object.freeze({
  cellGap: CELL_GAP,
  create(items = []) {
    return new CliffyTable(items).padding(CELL_GAP);
  },
});
