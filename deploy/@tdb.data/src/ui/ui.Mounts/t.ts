import type { t } from './common.ts';

/**
 * UI helpers for loading and selecting staged data mounts.
 */
export declare namespace Mounts {
  export type Lib = {
    readonly UI: t.FC<Props>;
    readonly use: {
      readonly Controller: UseController;
    };
  };

  export type Props = {
    origin: t.StringUrl;
    selected?: t.StringId;
    onSelect?: (next: t.StringId) => void;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };

  export type UseController = (args: UseControllerArgs) => ControllerState;
  export type UseControllerArgs = Pick<Props, 'origin' | 'selected' | 'onSelect'>;
  export type ControllerState = {
    readonly loading: t.Signal<boolean>;
    readonly error: t.Signal<string | undefined>;
    readonly mounts: t.Signal<readonly t.SlugMounts.Entry[] | undefined>;
    readonly selected: t.Signal<t.StringId | undefined>;
  };
}
