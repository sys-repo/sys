import { DEFAULTS, FC, type t } from './common.ts';
import { View } from './ui.tsx';
import { Main } from './ui.Main.tsx';

/**
 * Export
 */
type Fields = {
  DEFAULTS: typeof DEFAULTS;
  Main: typeof Main;
};

export const Dev = FC.decorate<t.CmdBarDevProps, Fields>(
  View,
  { DEFAULTS, Main },
  { displayName: DEFAULTS.displayName },
);
