import { DEFAULTS, FC, type t } from './common.ts';
import { Blue } from './Root.Blue.tsx';
import { View } from './ui.Button.tsx';
import { CopyButton as Copy } from './ui.CopyButton.tsx';

type Fields = {
  DEFAULTS: typeof DEFAULTS;
  Blue: typeof Blue;
  Copy: typeof Copy;
};
export const Button = FC.decorate<t.ButtonProps, Fields>(
  View,
  { DEFAULTS, Copy, Blue },
  { displayName: DEFAULTS.displayName },
);
