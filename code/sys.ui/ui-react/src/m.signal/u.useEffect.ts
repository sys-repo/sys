import { useSignalEffect as preactUseEffect } from '@preact/signals-react';
import { type t, Is, Rx, Try } from './common.ts';

/**
 * React hook: lifecycle-aware Signals effect (lazy Abortable).
 *
 * Wraps Preact's `useSignalEffect` and passes a context `e` with a lazy `life`
 * getter. The Abortable is created only if `e.life` is accessed during a run.
 * Cleanup order: user cleanup → life.dispose() (if created).
 */
export const useSignalEffect: t.UseSignalEffectListener = (cb) => {
  preactUseEffect(() => {
    let life: t.Abortable | undefined;

    const e: t.UseSignalEffectFnArgs = {
      get life() {
        return (life ??= Rx.abortable());
      },
    };

    const cleanup = cb(e);

    return () => {
      if (Is.func(cleanup)) Try.run(cleanup);
      if (life && !life.disposed) Try.run(life.dispose);
    };
  });
};
