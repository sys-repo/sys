import type { t } from '../common.ts';

/** Type re-exports. */
export type * from '../common.t.ts';

/**
 * Test, Spec types (internal).
 */
export type * from './-SPEC.Debug.tsx';

/** Harness-only scenario; never persisted or exported by the package. */
export type PasskeyFixture = {
  readonly id: string;
  readonly label: string;
  readonly snapshot: t.Passkey.Snapshot;
};

/** Callback history for one pure specimen instance; never persisted. */
export type PasskeyCallbackHistory = {
  /** The newest retained callbacks, ordered oldest to newest. */
  readonly items: readonly { readonly kind: t.Passkey.Action }[];
  /** All callbacks since fixture selection or reset, including those no longer retained. */
  readonly total: number;
};

/** Existing readout projection, not an authentication outcome. */
export type PasskeyIntent = {
  readonly action: t.Passkey.Action;
  readonly count: number;
};

/** Debug-only feedback for the latest intent and total captured event count. */
export type PasskeyIntentProps = { intent?: PasskeyIntent };
