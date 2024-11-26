import { DEFAULTS, FC, type t } from './common.ts';
import { View } from './ui.tsx';
import { Combo } from './ui.Combo.tsx';

/**
 * Export
 */
type Fields = {
  DEFAULTS: typeof DEFAULTS;
  Combo: typeof Combo;
};
export const KeyHint = FC.decorate<t.KeyHintProps, Fields>(
  View,
  { DEFAULTS, Combo },
  { displayName: DEFAULTS.displayName.KeyHint },
);
