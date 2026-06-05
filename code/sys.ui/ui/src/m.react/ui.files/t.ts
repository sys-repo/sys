import type { t } from './common.ts';
import type * as TInfoPanel from './ui.InfoPanel/t.ts';

/**
 * React UI affordances for Files<T> clients.
 */
export declare namespace Files {
  export type Lib = { readonly InfoPanel: t.FC<InfoPanel.Props> };

  /**
   * Files<T> client status optics.
   */
  export namespace InfoPanel {
    export type Field = TInfoPanel.Field;
    export type Snapshot = TInfoPanel.Snapshot;
    export type Props = TInfoPanel.Props;
  }
}
