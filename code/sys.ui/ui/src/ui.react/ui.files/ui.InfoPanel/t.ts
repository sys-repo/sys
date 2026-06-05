import type { t } from '../common.ts';

/** Display fields rendered by the info panel. */
export type Field = 'status:title' | 'status' | 'fidelity' | 'capabilities' | 'error';

/** Immutable moment-in-time facts read from a Files<T> client handle. */
export type Snapshot = {
  readonly status: t.Service.State;
  readonly capabilities?: t.ModelFiles.Capabilities;
  readonly error?: t.StdError;
};

export type Props = {
  title?: string;
  snapshot?: Snapshot;
  fields?: Field[];
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.Style.Input;
};
