/**
 * @module
 * @types Harness
 */
import type { t } from '../common.ts';

/**
 * The transient UI state of the DevHarness.
 */
export type HarnessState = {
  split: t.Percent;
};

/** Imutable reference of the Harness state. */
export type HarnessStateRef = t.ImmutableRef<Partial<HarnessState>>;
