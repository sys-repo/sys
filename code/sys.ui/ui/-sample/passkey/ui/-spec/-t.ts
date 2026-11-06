import type { t } from '../common.ts';

/** Type re-exports. */
export type * from '../../common.t.ts';

/**
 * Test, Spec types (internal).
 */
export type * from './-SPEC.Debug.tsx';

/** Harness-only scenario and intent records; never persisted or exported by the package. */
export type PasskeyFixture = {
  readonly id: string;
  readonly label: string;
  readonly snapshot: t.Passkey.Snapshot;
};

export type PasskeyIntent = {
  readonly action: t.Passkey.Action;
  readonly count: number;
};

/** Debug-only feedback for the latest intent and total captured event count. */
export type PasskeyIntentProps = { intent?: PasskeyIntent };
