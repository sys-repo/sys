import { Table as CliffyTable } from '@cliffy/table';
import type { t } from './common.ts';

/**
 * Tools for working with CLI tables.
 */
export const Table: t.CliTableLib = {
  create(items) {
    return new CliffyTable(items).padding(3);
  },
};
