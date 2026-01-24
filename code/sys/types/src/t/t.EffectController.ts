import type { t } from './common.ts';

/**
 * EffectController — minimal orchestration primitive.
 *
 * A state container that:
 * - owns orchestration state
 * - accepts incremental change via `next(patch)`
 * - hosts attached effects that react to state changes
 * - exposes a stable snapshot via `current()`
 * - signals change via `rev` and `onChange`
 * - owns lifecycle (disposal, effect teardown)
 *
 * This is a system-level coordination primitive,
 * not a React pattern or framework specific construct.
 */
export type EffectController<State, Patch = Partial<State>> = t.Lifecycle & {
  /** Unique identifier for this controller instance. */
  readonly id: t.StringId;

  /** Monotonic revision; increments only on real state change. */
  readonly rev: t.NumberMonotonic;

  /** Read the current state snapshot. */
  current(): State;

  /** Apply a partial update (intent); notifies subscribers and attached effects. */
  next(patch: Patch): void;

  /** Subscribe to state changes. Returns unsubscribe function. */
  onChange(fn: EffectControllerChangeHandler<State>): () => void;
};

/**
 * Callback invoked when controller state changes.
 */
export type EffectControllerChangeHandler<State> = (state: State) => void;
