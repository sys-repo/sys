import { Dispose, isRecord, type t } from './common.ts';
import { Is } from './m.Is.ts';
import { effect as baseEffect } from './u.effect.ts';

type O = Record<string, unknown>;

/**
 * Create a new listeners collection.
 */
export const listeners: t.Signal.Lib['listeners'] = (until) => {
  const life = Dispose.lifecycle(until);
  const disposers = new Set<() => void>();

  const effect = (fn: t.SignalEffectFn) => {
    if (life.disposed) return api;

    const dispose = baseEffect((e) => {
      // Cleanup or an initial run can retire the collection before a queued rerun.
      if (!life.disposed) return fn(e);
    });

    // Activation is synchronous and may dispose the owner before returning its disposer.
    if (life.disposed) {
      dispose();
      dispose(); // Same bounded second teardown opportunity as retained effects below.
    } else disposers.add(dispose);

    return api;
  };

  life.dispose$.subscribe(() => {
    const pending = [...disposers];
    disposers.clear(); // Release membership before invoking reentrant user cleanup.
    for (const dispose of pending) dispose();
    // Preserve the former per-registration disposal pass: a throwing Preact unwatched
    // hook can interrupt dependency removal despite baseEffect containing the error.
    // This is a bounded compatibility measure, not general exception-safe teardown.
    for (const dispose of pending) dispose();
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
