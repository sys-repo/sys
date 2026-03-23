import { type t, Args, Path, Time, stripAnsi } from '../common.ts';

import { Fmt } from '../m.Fmt/mod.ts';
import { Input } from '../m.Input/mod.ts';
import { Keyboard } from '../m.Keyboard/mod.ts';
import { Prompt } from '../m.Prompt/mod.ts';
import { Screen } from '../m.Screen/mod.ts';
import { Spinner } from '../m.Spinner/mod.ts';
import { Table } from '../m.Table/mod.ts';
import { copyToClipboard, keepAlive } from '../u/mod.ts';

/**
 * Tools for the CLI (command-line interfaces):
 */
export const Cli: t.CliLib = {
  Args,
  Table,
  Spinner,
  Path,
  Fmt,
  Keyboard,
  Screen,

  Input,
  Prompt,

  args: Args.parse,
  table: Table.create,
  spinner: Spinner.create,
  wait: Time.wait,
  keypress: Keyboard.keypress,

  stripAnsi,
  copyToClipboard,
  keepAlive,
};
