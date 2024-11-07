import { Args } from '@sys/std/args';
import { Path } from '@sys/std/path';
import { Value } from '@sys/std/value';

import { Time, type t } from './common.ts';
import { Format } from './m.Format.ts';
import { Keyboard } from './m.Keyboard.ts';
import { Prompts } from './m.Prompts.ts';
import { Spinner } from './m.Spinner.ts';
import { Table } from './m.Table.ts';

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
  Keyboard,

  args: Args.parse,
  table: Table.create,
  spinner: Spinner.create,
  wait: Time.wait,

  Prompts,
  confirm: (options) => Prompts.Confirm.prompt(options),
};
