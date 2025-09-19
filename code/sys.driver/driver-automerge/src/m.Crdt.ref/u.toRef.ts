import type {
  ChangeFn,
  DocHandleChangePayload,
  DocHandleDeletePayload,
} from '@automerge/automerge-repo';

import { type t, Dispose, rx, slug } from './common.ts';
import { type RefEvents, eventsFactory } from './u.events.ts';
import { REF } from './u.toAutomergeHandle.ts';

type O = Record<string, unknown>;

/**
 * Convert an automerge DocHandle to an immutable CRDT reference.
 */
export function toRef<T extends O>(handle: t.DocHandle<T>, until$?: t.UntilInput): t.CrdtRef<T> {
  const instance = slug();
  const id = handle.documentId;
  const $$ = rx.subject<RefEvents<T>>();
  let _final!: T;
  let _deleted = false;

  // Keep last known "after" snapshot to finalize safely if handle.doc() isn't available.
  let _lastAfter: T | undefined;

  /**
   * Event Monitor:
   *  - Defer emissions to the next microtask so userland subscribers
   *    don't run on Automerge's internal callback stack (avoid re-entrancy error).
   */
  const emitAsync = (ev: RefEvents<T>) => queueMicrotask(() => $$.next(ev));

  const onChange = (e: DocHandleChangePayload<T>) => {
    const { patches, patchInfo } = e;
    const { before, after, source } = patchInfo;

    // Capture latest "after" for safe finalization on dispose/delete.
    _lastAfter = after;

    // Defer and expose before/after lazily so they’re read post-AM callback.
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
    queueMicrotask(() => life.dispose());
  };

  /**
   * Lifecycle:
   */
  const life = rx.lifecycle(until$);
  life.dispose$.subscribe(() => {
    // Finalize snapshot without throwing if handle isn't ready anymore.
    try {
      _final = handle.doc();
    } catch {
      if (_lastAfter !== undefined) _final = _lastAfter;
    }
    handle.off('change', onChange);
    handle.off('delete', onDelete);
  });

  /**
   * API:
   */
  const ref: t.CrdtRef<T> = Dispose.toLifecycle(life, {
    id,
    instance,
    get current() {
      if (life.disposed) return _final;
      return handle.doc();
    },
    get deleted() {
      return _deleted;
    },
    change(fn, options) {
      if (life.disposed) return;
      const op = wrangle.changeOptions(options);
      handle.change(fn as ChangeFn<T>, { patchCallback: (patches) => op.patches?.(patches) });
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
