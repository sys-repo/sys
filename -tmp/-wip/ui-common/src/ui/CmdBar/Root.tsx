import { Ctrl, Is, Path } from '../CmdBar.Ctrl/mod.ts';
import { Dev } from '../CmdBar.Dev/mod.ts';
import { CmdBarStateful as Stateful } from '../CmdBar.Stateful/mod.ts';
import { Args, DEFAULTS, FC, TextboxSync as Sync, type t } from './common.ts';
import { View } from './ui.tsx';

/**
 * Export
 */
type Fields = {
  DEFAULTS: typeof DEFAULTS;
  Args: typeof Args;
  Ctrl: typeof Ctrl;
  Is: typeof Is;
  Path: typeof Path;
  Sync: typeof Sync;
  Stateful: typeof Stateful;
  Dev: typeof Dev;
};
export const CmdBar = FC.decorate<t.CmdBarProps, Fields>(
  View,
  { DEFAULTS, Args, Ctrl, Is, Path, Sync, Stateful, Dev },
  { displayName: DEFAULTS.displayName },
);
