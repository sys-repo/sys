import type Preact from '@preact/signals-react';
import type { Signal as StdSignal } from '@sys/std/t';
import type { Signal as SignalType } from '@sys/types';
import type { t } from './common.ts';

export type { ReadonlySignal, SignalValue, UnwrapSignals } from '@sys/types';
export type Signal<T = unknown> = SignalType<T>;

/**
 * Reactive Signals (React extensions).
 */
export declare namespace Signal {
  /** React-facing signal helper surface. */
  export type Lib = StdSignal.Lib & {
    /** Create a reactive Signal bound to component render lifecycle. */
    readonly useSignal: typeof Preact.useSignal;

    /** Register a lifecycle-aware reactive effect. */
    readonly useEffect: Effect.Listener;

    /** Trigger a safe redraw when signals read inside the callback change. */
    readonly useRedrawEffect: RedrawEffect.Listener;
  };

  /**
   * Lifecycle-aware React signal effect contracts.
   */
  export namespace Effect {
    /** Register a lifecycle-aware hook effect; no disposer is returned. */
    export type Listener = (fn: Fn) => void;

    /** Effect callback receiving the run lifecycle context; may return a cleanup. */
    export type Fn = (e: Args) => void | (() => void);

    /** Lazy lifecycle for a single run; aborts on re-run or unmount. */
    export type Args = { readonly life: t.Abortable };
  }

  /**
   * Lifecycle-aware redraw effect contracts.
   */
  export namespace RedrawEffect {
    /** Register a lifecycle-aware redraw effect; no disposer is returned. */
    export type Listener = (fn: Fn) => void;

    /** Redraw callback; may optionally use `e.life` and/or return a cleanup. */
    export type Fn = (e: Effect.Args) => void | (() => void);
  }
}
