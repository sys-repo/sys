import type * as TInfoPanel from './ui.InfoPanel/t.ts';

/**
 * React UI affordances for Files<T> clients.
 */
export declare namespace Files {
  /** Runtime surface for Files<T> React affordances. */
  export type Lib = { readonly InfoPanel: TInfoPanel.InfoPanel.Lib };

  /**
   * Files<T> client status optics.
   */
  export namespace InfoPanel {
    /** Public InfoPanel component surface. */
    export type Lib = TInfoPanel.InfoPanel.Lib;
    /** Signal-backed state consumed by the InfoPanel controller. */
    export type State = TInfoPanel.InfoPanel.State;
    /** Named display field rendered by the InfoPanel. */
    export type Field = TInfoPanel.InfoPanel.Field;
    /** Immutable status facts projected from a Files<T> client. */
    export type Snapshot = TInfoPanel.InfoPanel.Snapshot;
    /** Props accepted by the uncontrolled InfoPanel. */
    export type Props = TInfoPanel.InfoPanel.Props;
    /** Props accepted by the signal-controlled InfoPanel. */
    export type ControlledProps = TInfoPanel.InfoPanel.ControlledProps;
    /** Inputs for constructing an InfoPanel controller. */
    export type ControllerArgs = TInfoPanel.InfoPanel.ControllerArgs;
    /** Factory signature for constructing an InfoPanel controller. */
    export type ControllerFactory = TInfoPanel.InfoPanel.ControllerFactory;
    /** Lifecycle and view-state surface of an InfoPanel controller. */
    export type Controller = TInfoPanel.InfoPanel.Controller;

    /**
     * Event-stream state projected by the panel.
     */
    export namespace Events {
      /** Plain serializable event-stream state. */
      export type State = TInfoPanel.InfoPanel.Events.State;
      /** Toggle callback emitted by the panel. */
      export type Toggle = TInfoPanel.InfoPanel.Events.Toggle;
      /** Renderable event-stream control state. */
      export type Control = TInfoPanel.InfoPanel.Events.Control;
      /** Signal-backed event-stream control input. */
      export type Controlled = TInfoPanel.InfoPanel.Events.Controlled;
    }
  }
}
