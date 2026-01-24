import type { t } from './common.ts';

/**
 * EffectController — minimal orchestration primitive.
 *
 * Owns a state snapshot and provides a single, explicit update verb (`next`).
 * Consumers attach effects by subscribing via `onChange` (and cleaning up via
 * the lifecycle). The controller itself is framework-agnostic: it is a small,
 * stable coordination surface for UI and other orchestrations.
 *
 * Design intent:
 * - one source of truth (state snapshot)
 * - one mutation entry point (`next`)
 * - one notification channel (`onChange`) + monotonic `rev`
 * - first-class lifecycle (effects must be disposable)
 *
 * Note: "effects" are not embedded magic; they are external subscriptions
 * bound to this controller’s lifecycle.
 */
export type EffectController<State, Patch = Partial<State>, Props = undefined> = t.Lifecycle & {
  /** Unique identifier for this controller instance. */
  readonly id: t.StringId;

  /**
   * Monotonic revision counter.
   * Increments only when the underlying state actually changes.
   */
  readonly rev: t.NumberMonotonic;

  /**
   * Read the current state snapshot (stable and side-effect free).
   */
  current(): State;

  /**
   * Apply an intent patch to the state.
   *
   * If the patch is a no-op (per controller semantics), this call does nothing:
   * no state change, no `rev` increment, and no `onChange` notification.
   */
  next(patch?: Patch): void;

  /**
   * Subscribe to state changes.
   * Returns an unsubscribe function (safe to call multiple times).
   */
  onChange(fn: EffectControllerChangeHandler<State>): () => void;

  //
} & (Props extends undefined ? {} : { readonly props: Props });

/**
 * Callback invoked after a successful state change.
 */
export type EffectControllerChangeHandler<State> = (state: State) => void;
