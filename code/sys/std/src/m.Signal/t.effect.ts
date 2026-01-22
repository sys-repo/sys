import type { t } from './common.ts';

/**
 * Register a lifecycle-aware effect.
 */
export type SignalEffectListener = (fn: SignalEffectFn, opts?: SignalEffectOptions) => () => void;

/** Options for lifecycle-aware effects (forwarded name). */
export type SignalEffectOptions = { name?: string };

/**
 * Effect callback receiving the run lifecycle; may return a cleanup.
 */
export type SignalEffectFn = (e: SignalEffectFnArgs) => void | (() => void);

/** Lifecycle for a single run; aborts on re-run or final dispose. */
export type SignalEffectFnArgs = {
  /** Abortable lifetime of the effect run. */
  readonly life: t.Abortable;

  /**
   * Launch an async task bound to this effect run.
   *
   * Contract:
   * - The task is started immediately and is tied to this run via closure over `life`.
   * - Implementations should suppress errors after `life` aborts.
   * - Callers must guard post-`await` commits via `if (life.signal.aborted) return`.
   */
  await(fn: () => Promise<void>): void;
};
