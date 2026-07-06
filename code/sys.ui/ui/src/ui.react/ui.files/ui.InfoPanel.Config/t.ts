import type { t } from './common.ts';

/**
 * InfoPanel configuration component contracts.
 */
export declare namespace InfoPanelConfig {
  /** Public runtime surface for the InfoPanelConfig component. */
  export type Lib = { readonly UI: t.FC<Props> };

  /** Props accepted by InfoPanelConfig. */
  export type Props = {
    fields?: t.Files.InfoPanel.Field[];
    events?: t.Files.InfoPanel.Events.Control;
    reorder?: boolean;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.Style.Input;
    onFieldsChange?: Fields.ChangeHandler;
  };

  /**
   * Field configuration details.
   */
  export namespace Fields {
    /** Receive the next visible InfoPanel field list. */
    export type ChangeHandler = (e: Change) => void;

    /** Field-change event payload. */
    export type Change = { readonly next: t.Files.InfoPanel.Field[] };
  }

  /**
   * Event configuration details.
   */
  export namespace Events {
    /** Event-stream control state reused from Files.InfoPanel. */
    export type Control = t.Files.InfoPanel.Events.Control;
  }
}
