import { Table as CliffyTable } from '@cliffy/table';
import type { CliTableLib } from './t.ts';
/**
 * Tools for working with CLI tables.
 */
export const Table: CliTableLib = {
  create(items) {
    return new CliffyTable(items).padding(3);
  },
};
