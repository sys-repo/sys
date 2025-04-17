import { effect as preactEffect } from '@preact/signals-core';
import { type t, Dispose } from './common.ts';

export const listeners: t.SignalLib['listeners'] = (until$) => {
  const life = Dispose.lifecycle(until$);
  const disposers = new Set<() => void>();

  const effect = (fn: t.SignalEffectFn) => {
    const dispose = preactEffect(fn);
    disposers.add(dispose);

    const sub = life.dispose$.subscribe(() => {
      dispose();
      disposers.delete(dispose);
      sub.unsubscribe();
    });

    return api;
  };

  life.dispose$.subscribe(() => {
    disposers.forEach((dispose) => dispose());
    disposers.clear();
  });

  /**
   * API:
   */
  const api: t.SignalListeners = {
    effect,
    get count() {
      return disposers.size;
    },

    /**
     * Lifecycle:
     */
    dispose: life.dispose,
    get dispose$() {
      return life.dispose$;
    },
    get disposed() {
      return life.disposed;
    },
  };

  return api;
};
