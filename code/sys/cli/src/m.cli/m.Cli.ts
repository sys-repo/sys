import { type t, Args, Path, Time, stripAnsi } from './common.ts';

import { Fmt } from './m.Fmt.ts';
import { Input } from './m.Input.ts';
import { Keyboard } from './m.Keyboard.ts';
import { Prompt } from './m.Prompt.ts';
import { Screen } from './m.Screen.ts';
import { Spinner } from './m.Spinner.ts';
import { Table } from './m.Table.ts';
import { copyToClipboard } from './u.clipboard.ts';
import { keepAlive } from './u.keepAlive.ts';

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
