import type { Ora as OraSpinner } from 'ora';
import type { Table as CliffyTable } from '@cliffy/table';

/**
 * Library: Tools for CLI (command-line-interface).
 */
export type CliLib = {
  /* Start a new spinner. */
  spinner(text?: string): OraSpinner;

  /* Create a new Table generator. */
  table(...items: string[][]): CliffyTable;
};
