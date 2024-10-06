import type { Table as CliffyTable } from '@cliffy/table';
import type { Ora as OraSpinner } from 'ora';
import type { t } from './common.ts';

/**
 * Library: Tools for CLI (command-line-interface).
 */
export type CliLib = {
  /* Tools for working with CLI tables. */
  readonly Table: t.CliTableLib;
  /* Create a new Table generator instance. */
  table: t.CliTableLib['create'];

  /* Tools for working with a CLI spinner. */
  readonly Spinner: t.CliSpinnerLib;
  /* Create (and start) a new spinner instance. */
  spinner: t.CliSpinnerLib['create'];

  /* Wait for the specified milliseconds NB: use with [await]. */
  wait: t.TimeLib['wait'];
};

/**
 * Tools for working with CLI tables.
 */
export type CliTableLib = {
  /* Create a new Table generator instance. */
  create(...items: string[][]): CliffyTable;
};

/**
 * Tools for working with a CLI spinner.
 */
export type CliSpinnerLib = {
  /* Create (and start) a new spinner instance. */
  create(text?: string): OraSpinner;
};
