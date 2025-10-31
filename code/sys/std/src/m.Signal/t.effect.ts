import type { t } from './common.ts';

/**
 * Signal.effect( ƒ ):
 */

/** Register a lifecycle-aware effect; returns a disposer. */
export type SignalEffectListener = (fn: SignalEffectFn, opts?: SignalEffectOptions) => () => void;
/** Options for lifecycle-aware effects (forwarded name). */
export type SignalEffectOptions = { name?: string };

/** Effect callback receiving the run lifecycle; may return a cleanup. */
export type SignalEffectFn = (e: SignalEffectFnArgs) => void | (() => void);
/** Lifecycle for a single run; aborts on re-run or final dispose. */
export type SignalEffectFnArgs = { readonly life: t.Abortable };
