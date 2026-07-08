import type { t } from './common.ts';

/** Button family runtime surface. */
export type ButtonsLib = {
  readonly Button: { Default: React.FC<t.ButtonProps> };
  readonly Icons: t.ButtonsIcons.Lib;
  readonly Switch: React.FC<t.Switch.Props>;
};
