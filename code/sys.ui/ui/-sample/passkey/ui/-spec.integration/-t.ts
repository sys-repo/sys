import type { t } from '../common.ts';
import type { createDebugSignals } from './-SPEC.Debug.tsx';

/** Type re-exports. */
export type * from '../common.t.ts';

/** Sidebar controls and display values, without an account handle. */
export type DebugProps = {
  debug: DebugSignals;
  context: t.Passkey.Context;
  service: t.Passkey.ServiceProps;
  style?: t.Style.Input;
};

export type DebugSignals = ReturnType<typeof createDebugSignals>;

/** Harness preferences only; no view snapshot or authentication state. */
export type DebugValues = {
  debug: boolean;
  theme: t.CommonTheme;
};
