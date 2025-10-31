import type { t } from './common.ts';

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
export type UseSignalEffectFn = (e: UseSignalEffectFnArgs) => void | (() => void);

/** Lazy lifecycle for a single run; aborts on re-run or unmount. */
export type UseSignalEffectFnArgs = { readonly life: t.Abortable };
