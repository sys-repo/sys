import { effect as preactEffect } from '@preact/signals-core';
import { type t, Dispose, isRecord } from './common.ts';
import { Is } from './m.Is.ts';

type O = Record<string, unknown>;

/**
 * Create a new listeners collection.
 */
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

/**
 * Hooks into signal(s) value property.
 */
export function listen(subject: t.Signal | Array<unknown> | O) {
  if (Is.signal(subject)) subject.value;
  if (Array.isArray(subject)) subject.filter((s) => Is.signal(s)).forEach((s) => s.value);
  if (isRecord(subject)) {
    Object.values(subject)
      .filter((s) => Is.signal(s))
      .forEach((s) => s.value);
  }
}
