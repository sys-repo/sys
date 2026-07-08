import type { t } from './common.ts';

/** Button family namespace. */
export declare namespace Buttons {
  /** Button family runtime surface. */
  export type Lib = {
    readonly Button: { Default: React.FC<t.ButtonProps> };
    readonly Icons: t.ButtonsIcons.Lib;
    readonly Switch: React.FC<t.Switch.Props>;
  };
}
