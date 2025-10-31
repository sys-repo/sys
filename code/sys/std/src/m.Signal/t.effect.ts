import type { t } from './common.ts';

/** Callback passed into a signal effect. */
export type SignalEffectFn = () => void | (() => void);

/**
 * Signal.effect:
 */

/** Options for lifecycle-aware effects (forwarded name). */
export type SignalEffectOptions = { name?: string };

/** Lifecycle for a single run; aborts on re-run or final dispose. */
export type SignalEffectWithLifecycleFnArgs = t.Abortable & {};

/** Optional cleanup invoked before next run and on final dispose. */
export type SignalEffectWithLifecycleReturn = void | (() => void);

/** Effect callback receiving the run lifecycle; may return a cleanup. */
export type SignalEffectWithLifecycleFn = (
  e: SignalEffectWithLifecycleFnArgs,
) => SignalEffectWithLifecycleReturn;

/** Register a lifecycle-aware effect; returns a disposer. */
export type SignalEffectListener = (
  fn: SignalEffectWithLifecycleFn,
  opts?: SignalEffectOptions,
) => () => void;
