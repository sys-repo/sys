import type { t } from './common.ts';

/**
 * UI helpers for loading and selecting staged data mounts.
 */
export declare namespace Mounts {
  /** Public mounts UI surface. */
  export type Lib = {
    readonly UI: t.FC<Props>;
    readonly use: {
      readonly Controller: UseController;
    };
  };

  /** Props for the staged mount selector UI. */
  export type Props = {
    origin: t.StringUrl;
    selected?: t.StringId;
    onSelect?: (next: t.StringId) => void;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };

  /** Hook for loading mounts and tracking the selected mount. */
  export type UseController = (args: UseControllerArgs) => ControllerState;

  /** Inputs consumed by the mounts controller hook. */
  export type UseControllerArgs = Pick<Props, 'origin' | 'selected' | 'onSelect'>;

  /** Reactive controller state for the mounts selector UI. */
  export type ControllerState = {
    readonly loading: t.Signal<boolean>;
    readonly error: t.Signal<string | undefined>;
    readonly mounts: t.Signal<readonly t.SlugMounts.Entry[] | undefined>;
    readonly selected: t.Signal<t.StringId | undefined>;
  };
}
