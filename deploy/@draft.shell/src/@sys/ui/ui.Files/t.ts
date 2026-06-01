import type { t } from './common.ts';

/**
 * Files<T> client status optics.
 */
export declare namespace FileInfoPanel {
  export type Lib = { readonly InfoPanel: t.FC<Props> };

  /** Display fields rendered by the info panel. */
  export type Field = 'status:title' | 'status' | 'fidelity' | 'capabilities' | 'error';

  /** Immutable moment-in-time facts read from a Files client handle. */
  export type Snapshot = {
    readonly status: t.Service.State;
    readonly capabilities?: t.Files.Capabilities;
    readonly error?: t.StdError;
  };

  export type Props = {
    title?: string;
    snapshot?: Snapshot;
    fields?: Field[];
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
