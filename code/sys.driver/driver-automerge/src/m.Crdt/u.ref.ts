import type { ChangeFn, DocHandleChangePayload } from '@automerge/automerge-repo';
import { type t, Dispose, rx, slug } from './common.ts';

type O = Record<string, unknown>;
const REF = Symbol('ref:handle');

/**
 * Extract the hidden handle from a [CrdtRef] document.
 */
export function toAutomergeHandle<T extends O>(doc?: t.CrdtRef<T>): t.DocHandle<T> | undefined {
  if (!doc) return;
  return (doc as any)[REF];
}

/**
 * Convert an automerge DocHandle to an immutable CRDT reference.
 */
export function toRef<T extends O>(handle: t.DocHandle<T>, until$?: t.UntilInput): t.CrdtRef<T> {
  const instance = slug();
  const id = handle.documentId;
  const $$ = rx.subject<t.CrdtChange<T>>();
  let _final: T;
  let _deleted = false;

  /**
   * Event Monitor:
   */
  const onChange = (e: DocHandleChangePayload<T>) => {
    const { patches, patchInfo } = e;
    const { before, after, source } = patchInfo;
    $$.next({ source, before, after, patches });
  };

  /**
   * Lifecycle:
   */
  const life = rx.lifecycle(until$);
  life.dispose$.subscribe(() => {
    _final = handle.doc();
    handle.off('change', onChange);
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
      const until = rx.disposable([dispose$, life.dispose$]);
      const $ = $$.pipe(rx.takeUntil(until.dispose$));
      return Dispose.toLifecycle(life, { $ });
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
