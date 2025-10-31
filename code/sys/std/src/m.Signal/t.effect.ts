import type { t } from './common.ts';

/**
 * Signal.effect( ƒ ):
 */

/** Options for lifecycle-aware effects (forwarded name). */
export type SignalEffectOptions = { name?: string };

/** Lifecycle for a single run; aborts on re-run or final dispose. */
export type SignalEffectFnArgs = t.Abortable & {};

/** Optional cleanup invoked before next run and on final dispose. */
export type SignalEffectReturn = void | (() => void);

/** Effect callback receiving the run lifecycle; may return a cleanup. */
export type SignalEffectFn = (e: SignalEffectFnArgs) => SignalEffectReturn;

/** Register a lifecycle-aware effect; returns a disposer. */
export type SignalEffectListener = (fn: SignalEffectFn, opts?: SignalEffectOptions) => () => void;
