import { type t, Args, Path, Time, Value, stripAnsi } from './common.ts';
import { Format } from './m.Format.ts';
import { Keyboard } from './m.Keyboard.ts';
import { Prompt } from './m.Prompt.ts';
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
  Prompt,

  args: Args.parse,
  table: Table.create,
  spinner: Spinner.create,
  wait: Time.wait,
  keypress: Keyboard.keypress,

  confirm: (options) => Prompt.Confirm.prompt(options),
  stripAnsi,
};
