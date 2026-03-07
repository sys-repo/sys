import type { t } from './common.ts';

type EffectReturn = void | (() => void);

/**
 * Signal.useEffect( ƒ ):
 * React hook variant: lifecycle-aware with a lazy Abortable.
 *
 * The callback receives a context `e` whose `life` getter lazily
 * materializes an Abortable for the current run. If `e.life` is never
 * accessed, no Abortable is created for that run.
 */

/** Register a lifecycle-aware hook effect (React); no disposer is returned. */
export type UseSignalEffectListener = (fn: UseSignalEffectFn) => void;

/** Effect callback receiving the run lifecycle context; may return a cleanup. */
export type UseSignalEffectFn = (e: UseSignalEffectFnArgs) => EffectReturn;

/** Lazy lifecycle for a single run; aborts on re-run or unmount. */
export type UseSignalEffectFnArgs = { readonly life: t.Abortable };

/**
 * Signal.useRedrawEffect( ƒ ):
 * React hook helper that triggers a safe redraw when signals read inside the
 * callback change. Mirrors the lifecycle-aware `UseSignalEffect` types so
 * implementors can lazily opt into `e.life` without forcing an Abortable.
 */

/** Register a lifecycle-aware redraw effect (React); no disposer is returned. */
export type UseRedrawEffectListener = (fn: UseRedrawEffectFn) => void;

/** Redraw callback; may optionally use `e.life` and/or return a cleanup. */
export type UseRedrawEffectFn = (e: UseSignalEffectFnArgs) => EffectReturn;
