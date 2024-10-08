import type { Table as CliffyTable } from '@cliffy/table';
import type { ArgsLib } from '@sys/std/t';
import type { Ora as OraSpinner } from 'ora';
import type { t } from './common.ts';

/**
 * Library: Tools for CLI (command-line-interface).
 */
export type CliLib = {
  /* Argument parsing helpers */
  readonly Args: ArgsLib;

  /* Tools for working with CLI tables. */
  readonly Table: t.CliTableLib;

  /* Tools for working with a CLI spinner. */
  readonly Spinner: t.CliSpinnerLib;

  /* Parse command-line argments into an object (argv). */
  args: ArgsLib['parse'];

  /* Create a new Table generator instance. */
  table: t.CliTableLib['create'];

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
