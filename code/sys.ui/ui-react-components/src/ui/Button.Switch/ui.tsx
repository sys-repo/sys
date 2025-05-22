import { DEFAULTS, FC, type t } from './common.ts';
import { SwitchTheme } from './u.theme.ts';
import { Switch as View } from './ui.Switch.tsx';

type Fields = {
  DEFAULTS: typeof DEFAULTS;
  Theme: typeof SwitchTheme;
};
export const Switch = FC.decorate<t.SwitchProps, Fields>(
  View,
  { DEFAULTS, Theme: SwitchTheme },
  { displayName: DEFAULTS.displayName },
);
