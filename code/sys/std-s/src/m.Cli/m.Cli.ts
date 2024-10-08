import { Args } from '@sys/std';
import { Time, type t } from './common.ts';
import { Spinner } from './u.Spinner.ts';
import { Table } from './u.Table.ts';

/**
 * Library: Tools for CLI (command-line-interface).
 */
export const Cli: t.CliLib = {
  Args,
  Table,
  Spinner,
  args: Args.parse,
  table: Table.create,
  spinner: Spinner.create,
  wait: Time.wait,
};
