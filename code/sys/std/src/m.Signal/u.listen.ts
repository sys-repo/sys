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
 * Hooks into signal(s) `.value` to create a reactive dependency.
 *
 * @param subject  A signal, array, or record to walk.
 * @param deep     When `true`, recurse into nested arrays/records.
 */
export function listen(
  subject?: unknown | unknown[] | O,
  deep: boolean = false,
  /** internal */ _seen: WeakSet<object> = new WeakSet(),
): void {
  if (!subject) return;

  // Guard against cycles.
  if (typeof subject === 'object' && subject !== null) {
    if (_seen.has(subject)) return;
    _seen.add(subject);
  }

  // Direct signal:
  if (Is.signal(subject)) {
    subject.value; // ← touch reactive value.
    return;
  }

  // Array (top-level, or recurse if deep):
  if (Array.isArray(subject)) {
    for (const item of subject) {
      if (Is.signal(item)) {
        item.value; // ← touch reactive value.
      } else if (deep && (Array.isArray(item) || isRecord(item))) {
        listen(item as unknown, true, _seen);
      }
    }
    return;
  }

  // Record (top-level, or recurse if deep):
  if (isRecord(subject)) {
    for (const value of Object.values(subject)) {
      if (Is.signal(value)) {
        value.value; // ← touch reactive value.
      } else if (deep && (Array.isArray(value) || isRecord(value))) {
        listen(value as unknown, true, _seen);
      }
    }
  }
}
