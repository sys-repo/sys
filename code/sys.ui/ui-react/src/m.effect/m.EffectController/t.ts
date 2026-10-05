import type { EffectController as StdEffectController } from '@sys/std/t';
import type { t } from './common.ts';

/** React-facing effect controller type. */
export type EffectController<State, Patch = Partial<State>, Props = undefined> =
  StdEffectController<State, Patch, Props>;

/**
 * EffectController contracts (React extensions).
 */
export declare namespace EffectController {
  /** React-facing effect-controller helper surface. */
  export type Lib = StdEffectController.Lib & {
    readonly useEffectController: Hook.Fn;
  };

  /**
   * React hook contracts for binding controllers to component lifecycle.
   */
  export namespace Hook {
    /** Bind an EffectController to component render lifecycle. */
    export type Fn = <State, Patch = Partial<State>, Props = undefined>(
      controller: t.EffectController<State, Patch, Props> | undefined,
      options?: Options<State, Patch, Props> | ChangeHandler<State, Patch, Props>,
    ) => State | undefined;

    /** Side-effect invoked after a controller change triggers a re-render. */
    export type ChangeHandler<State, Patch = Partial<State>, Props = undefined> = (
      e: ChangeEvent<State, Patch, Props>,
    ) => void;

    /** Event payload for `useEffectController` change notifications. */
    export type ChangeEvent<State, Patch = Partial<State>, Props = undefined> = {
      readonly controller: t.EffectController<State, Patch, Props>;
      readonly state: State;
    };

    /** Options passed to the `useEffectController` hook. */
    export type Options<State, Patch = Partial<State>, Props = undefined> = {
      /** Optional side-effect invoked after a controller change triggers a re-render. */
      onChange?: ChangeHandler<State, Patch, Props>;

      /** If true, also invoke `onChange` once on initial mount. Default false. */
      readonly fireOnInit?: boolean;
    };
  }
}
