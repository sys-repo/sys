import type {
  ChangeFn,
  DocHandleChangePayload,
  DocHandleDeletePayload,
} from '@automerge/automerge-repo';

import { type t, Dispose, rx, slug, Time } from './common.ts';
import { type RefEvents, eventsFactory } from './u.events.ts';
import { REF } from './u.toAutomergeHandle.ts';

type O = Record<string, unknown>;

const fail = (code: string, message: string) => {
  const err = new Error(message) as Error & { code: string };
  err.code = code;
  return err;
};

/**
 * Convert an automerge DocHandle to an immutable CRDT reference.
 * - All deferred work goes through Time.scheduler to avoid re-entrancy.
 */
export function toRef<T extends O>(handle: t.DocHandle<T>, until$?: t.UntilInput): t.CrdtRef<T> {
  const instance = slug();
  const id = handle.documentId;
  const $$ = rx.subject<RefEvents<T>>();
  let _final!: T;
  let _deleted = false;

  // Keep last known "after" snapshot to finalize safely if handle.doc() isn't available.
  let _lastAfter: T | undefined;
  let _seeded = false;

  /**
   * Lifecycle / scheduling:
   * NB: use scheduler for all queued work (microtask boundary; safe against re-entrancy).
   */
  const life = rx.lifecycle(until$);
  const schedule = Time.scheduler(life, 'micro');

  /**
   * Helpers:
   */
  const trySeedNow = () => {
    try {
      const v = handle.doc();
      _lastAfter = v;
      _seeded = true;
    } catch {
      /* not ready */
    }
  };

  const bestSafeValue = (): T => {
    if (_lastAfter !== undefined) return _lastAfter;
    if (_final !== undefined) return _final;
    return Object.freeze({}) as T;
  };

  /**
   * Event Monitor:
   * - Defer emissions via scheduler so userland subscribers never run on Automerge's callback stack.
   */
  const emitAsync = (ev: RefEvents<T>) => schedule(() => $$.next(ev));

  // Best-effort initial seed.
  try {
    _lastAfter = handle.doc();
    _seeded = true;
  } catch {
    /* will seed later */
  }

  const onChange = (e: DocHandleChangePayload<T>) => {
    const { patches, patchInfo } = e;
    const { before, after, source } = patchInfo;

    // Capture latest "after" for safe reads and finalization.
    _lastAfter = after;
    _seeded = true;

    // Defer and expose before/after lazily so they are read post-AM callback.
    emitAsync({
      type: 'change',
      payload: {
        source,
        patches,
        get before() {
          return before;
        },
        get after() {
          return after;
        },
      },
    });
  };

  const onDelete = (_e: DocHandleDeletePayload<T>) => {
    _deleted = true;
    // Prefer lastAfter; we may lose access to handle.doc() soon.
    if (_lastAfter !== undefined) _final = _lastAfter;
    emitAsync({ type: 'deleted', payload: { id } });

    // Dispose lifecycle after deletion emission is queued.
    schedule(() => life.dispose());
  };

  life.dispose$.subscribe(() => {
    // Finalize snapshot without throwing if handle isn't ready anymore.
    try {
      _final = handle.doc();
    } catch {
      if (_lastAfter !== undefined) _final = _lastAfter;
    }
    handle.off('change', onChange);
    handle.off('delete', onDelete);

    // Complete the subject so downstream takeUntil chains tear down deterministically.
    try {
      $$.complete();
    } catch {
      /* noop */
    }
  });

  /**
   * API:
   */
  const ref: t.CrdtRef<T> = Dispose.toLifecycle(life, {
    id,
    instance,
    get current() {
      if (life.disposed) return _final;

      // Direct read; no RepoBusy/idle gating here. Safe fallback if not ready.
      try {
        const value = handle.doc();
        _lastAfter = value; // keep snapshot fresh
        _seeded = true;
        return value;
      } catch {
        // If we haven't seeded yet, attempt an immediate seed (might still fail harmlessly).
        if (!_seeded) trySeedNow();
        return bestSafeValue();
      }
    },
    get deleted() {
      return _deleted;
    },
    change(fn, options) {
      if (life.disposed) return;

      // Explicit pre-conditions:
      if (_deleted) throw fail('ref/deleted', 'Cannot change a deleted CRDT ref.');
      try {
        // Probe readiness explicitly (cheap read).
        // If this throws, the doc/handle isn’t ready; fail fast with a stable code.
        handle.doc();
      } catch {
        throw fail('ref/not-ready', 'CRDT document is not ready for writes.');
      }

      const op = wrangle.changeOptions(options);

      // Perform the write. Let automerge errors bubble (they’re genuine programmer errors).
      handle.change(fn as ChangeFn<T>, {
        patchCallback: (patches) => op.patches?.(patches),
      });

      // Ensure snapshot refresh soon after write (in case no change event surfaces immediately).
      schedule(() => {
        try {
          _lastAfter = handle.doc();
          _seeded = true;
        } catch {
          /* ignore; will refresh on next change */
        }
      });
    },
    events(dispose$) {
      const events = eventsFactory($$, [dispose$, life.dispose$]);
      if (life.disposed) events.dispose(); // edge-case: return already-disposed events for consistency
      return events;
    },
  });

  // Hidden handle reference (automerge).
  Object.defineProperty(ref, REF, {
    value: handle,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  // Wire up events:
  handle.on('change', onChange);
  handle.on('delete', onDelete);

  return ref;
}

/**
 * Helpers:
 */
const wrangle = {
  changeOptions(input?: any): t.ImmutableChangeOptions<t.CrdtPatch> {
    if (!input) return {};
    if (typeof input === 'function') return { patches: input };
    return input;
  },
} as const;
