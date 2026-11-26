import type { t } from '../ui/common.ts';

/**
 * Host-owned passkey panel controller and its borrowing React view.
 */
export declare namespace Controller {
  /** Open a panel controller or render a view of an existing one. */
  export type Lib = {
    /** Open outside React render; the host must dispose when its context ends. */
    readonly open: () => Instance;
    /** Render observations and forward intents without owning the controller. */
    readonly UI: t.FC<Props>;
  };

  /**
   * Owns page lifetime and bounded session observation after an uncertain action.
   */
  export type Instance = {
    readonly current: () => t.AccountRuntime.State.Snapshot;
    readonly subscribe: (notify: () => void) => () => void;
    readonly run: (action: t.Passkey.Action) => Promise<void>;
    readonly dispose: () => void;
  };

  export type Props = Pick<t.Passkey.Props, 'theme' | 'debug' | 'view' | 'sections' | 'style'> & {
    readonly controller: Pick<Instance, 'current' | 'subscribe' | 'run'>;
  };
}
