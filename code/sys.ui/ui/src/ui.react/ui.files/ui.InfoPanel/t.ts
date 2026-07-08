import type { t } from '../common.ts';
import type { InfoPanelConfig } from '../ui.InfoPanel.Config/t.ts';

/**
 * Files InfoPanel component contracts.
 */
export declare namespace InfoPanel {
  /** Public InfoPanel component surface. */
  export type Lib = {
    readonly UI: {
      readonly Uncontrolled: t.FC<Props>;
      readonly Controlled: t.FC<ControlledProps>;
    };
    readonly Config: InfoPanelConfig.Lib;
    readonly controller: ControllerFactory;
  };

  /** Signal-backed state consumed by the InfoPanel controller. */
  export type State = {
    readonly debug?: boolean;
    readonly theme?: t.CommonTheme;
    readonly snapshot?: Snapshot;
    readonly events: Events.State;
  };

  /** Props accepted by the uncontrolled InfoPanel. */
  export type Props = {
    title?: string;
    snapshot?: State['snapshot'];
    fields?: Field[];
    events?: Events.Control;
    transport?: Transport.Control;
    animation?: t.KeyValue.Animation;
    debug?: State['debug'];
    theme?: State['theme'];
    style?: t.Style.Input;
  };

  /** Display fields rendered by the info panel. */
  export type Field =
    | 'status:title'
    | 'status'
    | 'transport'
    | 'fidelity'
    | 'capabilities'
    | 'error'
    | 'events';

  /** Immutable moment-in-time facts read from a Files<T> client handle. */
  export type Snapshot = {
    readonly status: t.Service.State;
    readonly capabilities?: t.ModelFiles.Capabilities;
    readonly error?: t.StdError;
  };

  /** Transport action control projected by the panel. */
  export namespace Transport {
    export type Action = () => void;
    export type Control = {
      onConnect?: Action;
      onDisconnect?: Action;
    };
  }

  /** Props accepted by the signal-controlled InfoPanel. */
  export type ControlledProps = Omit<Props, 'debug' | 'theme' | 'snapshot' | 'events'> & {
    debug?: t.Signal<boolean | undefined>;
    theme?: t.Signal<t.CommonTheme | undefined>;
    snapshot?: t.Signal<Snapshot | undefined>;
    events?: Events.Controlled;
  };

  /** Inputs for constructing an InfoPanel controller. */
  export type ControllerArgs = {
    props?: Pick<Props, 'debug' | 'theme' | 'snapshot' | 'events'>;
    debug?: t.Signal<boolean | undefined>;
    theme?: t.Signal<t.CommonTheme | undefined>;
    snapshot?: t.Signal<Snapshot | undefined>;
    events?: Events.Controlled;
  };

  /** Factory signature for constructing an InfoPanel state controller. */
  export type ControllerFactory = (args?: ControllerArgs) => Controller;

  /** Controller contract exposing lifecycle hooks and derived view state. */
  export type Controller = t.Lifecycle & {
    readonly rev: t.NumberMonotonic;
    readonly listen: () => void;
    readonly view: () => Pick<Props, 'debug' | 'theme' | 'snapshot' | 'events'>;
    readonly state: {
      readonly debug: t.ReadonlySignal<boolean | undefined>;
      readonly theme: t.ReadonlySignal<t.CommonTheme | undefined>;
      readonly snapshot: t.ReadonlySignal<Snapshot | undefined>;
      readonly events: { readonly enabled: t.ReadonlySignal<boolean | undefined> };
    };
  };

  /**
   * Event-stream state projected by the panel.
   */
  export namespace Events {
    /** Plain serializable event-stream state. */
    export type State = { enabled?: boolean };
    /** Toggle callback emitted by the panel. */
    export type Toggle = (next: boolean) => void;
    /** Renderable event-stream control state. */
    export type Control = State & { onToggle?: Toggle };
    /** Signal-backed event-stream control input. */
    export type Controlled = {
      enabled?: t.Signal<boolean | undefined>;
      onToggle?: Toggle;
    };
  }
}
