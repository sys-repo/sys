import { DEFAULTS, FC, type t } from './common.ts';
import { View } from './ui.tsx';

/**
 * Export
 */
type Fields = { DEFAULTS: typeof DEFAULTS };
export const Prefix = FC.decorate<t.CmdPrefixProps, Fields>(
  View,
  { DEFAULTS },
  { displayName: DEFAULTS.displayName },
);
