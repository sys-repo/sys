import { Table as CliffyTable } from '@cliffy/table';
import type { t } from '../common.ts';

export const CELL_GAP = 3;

/**
 * Create a Cliffy table with the default cell gap.
 */
export const create: t.CliTable.Create = (items = []) => {
  return new CliffyTable(items).padding(CELL_GAP);
};
