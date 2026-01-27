import type { t } from './common.ts';

/**
 * React hook: binds an EffectController to component render lifecycle.
 *
 * - Subscribes via `controller.onChange(...)`.
 * - Re-renders when the controller changes.
 * - Returns the current snapshot via `controller.current()`.
 * - Optionally runs `options.onChange(...)` after changes.
 *
 * Options may be passed either as:
 * - an options object, or
 * - a shorthand callback `(e) => void` (equivalent to `{ onChange: fn }`).
 */
export type UseEffectController = <State, Patch = Partial<State>, Props = undefined>(
  controller: t.EffectController<State, Patch, Props> | undefined,
  options?:
    | UseEffectControllerOptions<State, Patch, Props>
    | UseEffectControllerChangeHandler<State, Patch, Props>,
) => State | undefined;

/**
 * Side-effect invoked after a controller change triggers a re-render.
 *
 * - Default: does NOT run on initial mount.
 * - Runs on subsequent changes.
 */
export type UseEffectControllerChangeHandler<State, Patch = Partial<State>, Props = undefined> = (
  e: EffectControllerChangeEvent<State, Patch, Props>,
) => void;

/**
 * Event payload for `useEffectController` change notifications.
 */
export type EffectControllerChangeEvent<State, Patch = Partial<State>, Props = undefined> = {
  readonly controller: t.EffectController<State, Patch, Props>;
  readonly state: State;
};

/** Options passed to the `useEffectController` hook */
export type UseEffectControllerOptions<State, Patch = Partial<State>, Props = undefined> = {
  /**
   * Optional side-effect invoked after a controller change triggers a re-render.
   *
   * - Default: does NOT run on initial mount.
   * - Runs on subsequent changes.
   */
  onChange?: UseEffectControllerChangeHandler<State, Patch, Props>;

  /** If true, also invoke onChange once on initial mount. Default false. */
  readonly fireOnInit?: boolean;
};
