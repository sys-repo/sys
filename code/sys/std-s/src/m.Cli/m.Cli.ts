import { Time, type t } from './common.ts';
import { Spinner } from './u.Spinner.ts';
import { Table } from './u.Table.ts';

/**
 * Library: Tools for CLI (command-line-interface).
 */
export const Cli: t.CliLib = {
  Table,
  Spinner,
  table: Table.create,
  spinner: Spinner.create,
  wait: Time.wait,
};
