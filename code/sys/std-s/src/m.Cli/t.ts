import { type t, type Time } from '../common.ts';

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

  /* Wait for the specified milliseconds NB: use with [await]. */
  wait: typeof Time.wait;
};
