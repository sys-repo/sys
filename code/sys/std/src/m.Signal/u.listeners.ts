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

  const api = Dispose.toLifecycle<t.SignalListeners>(life, {
    effect,
    get count() {
      return disposers.size;
    },
  });

  return api;
};
