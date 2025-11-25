import type { CliffyTable } from './t.ext.ts';

/**
 * Tools for working with CLI tables.
 */
export type CliTableLib = {
  /** Create a new Table generator instance. */
  create(...items: string[][]): CliTable;
};

/** Represents a table that can be written to the console. */
export type CliTable = CliffyTable;
