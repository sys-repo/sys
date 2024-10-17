import { Args } from '@sys/std/args';
import { Path } from '@sys/std/path';
import { Value } from '@sys/std/value';

import { Time, type t } from './common.ts';
import { Format } from './m.Format.ts';
import { Prompts } from './u.Prompts.ts';
import { Spinner } from './u.Spinner.ts';
import { Table } from './u.Table.ts';

/**
 * Tools for CLI's (command-line-interface).
 */
export const Cli: t.CliLib = {
  Args,
  Table,
  Spinner,
  Value,
  Path,
  Format,

  args: Args.parse,
  table: Table.create,
  spinner: Spinner.create,
  wait: Time.wait,

  Prompts,
  confirm: (options) => Prompts.Confirm.prompt(options),
};
