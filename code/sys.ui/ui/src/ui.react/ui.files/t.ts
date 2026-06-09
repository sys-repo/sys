import type * as TInfoPanel from './ui.InfoPanel/t.ts';

/**
 * React UI affordances for Files<T> clients.
 */
export declare namespace Files {
  export type Lib = { readonly InfoPanel: TInfoPanel.InfoPanel.Lib };

  /**
   * Files<T> client status optics.
   */
  export namespace InfoPanel {
    export type Lib = TInfoPanel.InfoPanel.Lib;
    export type State = TInfoPanel.InfoPanel.State;
    export type Field = TInfoPanel.InfoPanel.Field;
    export type Snapshot = TInfoPanel.InfoPanel.Snapshot;
    export type Props = TInfoPanel.InfoPanel.Props;
    export type ControlledProps = TInfoPanel.InfoPanel.ControlledProps;
    export type ControllerArgs = TInfoPanel.InfoPanel.ControllerArgs;
    export type ControllerFactory = TInfoPanel.InfoPanel.ControllerFactory;
    export type Controller = TInfoPanel.InfoPanel.Controller;

    /**
     * Event-stream state projected by the panel.
     */
    export namespace Events {
      export type State = TInfoPanel.InfoPanel.Events.State;
      export type Toggle = TInfoPanel.InfoPanel.Events.Toggle;
      export type Control = TInfoPanel.InfoPanel.Events.Control;
      export type Controlled = TInfoPanel.InfoPanel.Events.Controlled;
    }
  }
}
