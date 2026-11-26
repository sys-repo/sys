import type { t } from '../ui/common.ts';

/**
 * Host-owned passkey panel controller and its borrowing React view.
 */
export declare namespace Controller {
  /** Open a panel controller or render a view of an existing one. */
  export type Lib = {
    /** Open outside React render; the host must dispose when its context ends. */
    readonly open: (options?: OpenOptions) => Instance;
    /** Render observations and forward intents without owning the controller. */
    readonly UI: t.FC<Props>;
  };

  /** Opt in to service diagnostics from the integration host only. */
  export type OpenOptions = {
    /** Read service counts while active and visible; off by default. */
    readonly observeService?: boolean;
  };

  /**
   * Owns page lifetime, service observation, and bounded recovery after an uncertain action.
   */
  export type Instance = {
    readonly current: () => t.AccountRuntime.State.Snapshot;
    readonly subscribe: (notify: () => void) => () => void;
    readonly run: (action: t.Passkey.Action) => Promise<void>;
    readonly service: Service;
    readonly dispose: () => void;
  };

  /** Read-only service observation. Snapshots stay stable until a new observation is published. */
  export type Service = {
    readonly availability: t.AccountRuntime.Info['availability'];
    readonly current: () => t.Passkey.ServiceObservation;
    readonly subscribe: (notify: () => void) => () => void;
  };

  export type Props = Pick<t.Passkey.Props, 'theme' | 'debug' | 'view' | 'sections' | 'style'> & {
    readonly controller: Pick<Instance, 'current' | 'subscribe' | 'run' | 'service'>;
  };
}
