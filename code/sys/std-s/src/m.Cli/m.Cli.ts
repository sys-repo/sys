import { Args } from '@sys/std';
import { Time, type t } from './common.ts';
import { Spinner } from './u.Spinner.ts';
import { Table } from './u.Table.ts';
import { Prompts } from './u.Prompts.ts';
import { Format } from './u.Format.ts';

/**
 * Library: Tools for CLI (command-line-interface).
 */
export const Cli: t.CliLib = {
  Args,
  Table,
  Spinner,
  Format,
  args: Args.parse,
  table: Table.create,
  spinner: Spinner.create,
  wait: Time.wait,

  Prompts,
  confirm: (options) => Prompts.Confirm.prompt(options),
};
