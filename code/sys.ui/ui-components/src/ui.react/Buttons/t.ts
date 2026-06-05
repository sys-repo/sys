import type { t } from './common.ts';

export type ButtonsLib = {
  readonly Button: { Default: React.FC<t.ButtonProps> };
  readonly Icons: t.ButtonsIconsLib;
  readonly Switch: React.FC<t.SwitchProps>;
};
