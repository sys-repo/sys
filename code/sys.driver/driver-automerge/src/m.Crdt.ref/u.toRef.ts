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
  let _final: T;
  let _deleted = false;

  /**
   * Event Monitor:
   */
  const onChange = (e: DocHandleChangePayload<T>) => {
    const { patches, patchInfo } = e;
    const { before, after, source } = patchInfo;
    $$.next({ type: 'change', payload: { source, before, after, patches } });
  };
  const onDelete = (e: DocHandleDeletePayload<T>) => {
    _deleted = true;
    $$.next({ type: 'deleted', payload: { id } });
    life.dispose();
  };

  /**
   * Lifecycle:
   */
  const life = rx.lifecycle(until$);
  life.dispose$.subscribe(() => {
    _final = handle.doc();
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
      if (life.disposed) events.dispose(); // NB: edge-case. Return events for consistency, but already dead (disposed).
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

  // Finish up.
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
