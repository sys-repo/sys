import type { ChangeFn } from '@automerge/automerge-repo';
import { type t, Dispose, rx, slug } from './common.ts';

type O = Record<string, unknown>;
const cache = new Map<string, t.CrdtRef<any>>();
const REF_HANDLE = Symbol('ref:handle');

/**
 * Convert an automerge DocHandle to an immutable CRDT reference.
 */
export function toRef<T extends O>(handle: t.DocHandle<T>, until$?: t.UntilInput): t.CrdtRef<T> {
  if (cache.has(handle.documentId)) return cache.get(handle.documentId)!;

  const instance = slug();
  const $ = rx.subject<t.CrdtChange<T>>();
  const cacheLifecycle = rx.disposable(until$);

  handle.on('change', (e) => {
    const { patches, patchInfo } = e;
    const { before, after, source } = patchInfo;
    $.next({ source, before, after, patches });
  });

  /**
   * API:
   */
  const ref: t.CrdtRef<T> = {
    instance,
    get current() {
      return handle.doc();
    },
    change(fn, op) {
      const options = wrangle.changeOptions(op);
      handle.change(fn as ChangeFn<T>, { patchCallback: (patches) => options.patches?.(patches) });
    },
    events(dispose$) {
      const life = rx.lifecycle(dispose$);
      const changed$ = $.pipe(rx.takeUntil(life.dispose$));
      return Dispose.toLifecycle(life, { changed$ });
    },
  };

  /**
   * Cache:
   */
  cache.set(handle.documentId, ref);
  cacheLifecycle.dispose$.subscribe(() => cache.delete(handle.documentId));

  // Hidden handle reference.
  Object.defineProperty(ref, REF_HANDLE, {
    value: handle,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  // Finish up.
  return ref;
}

/**
 * Extract the hidden handle from a [CrdtRef] document.
 */
export function toHandle<T extends O>(doc: t.CrdtRef<T>): t.DocHandle<T> | undefined {
  return (doc as any)[REF_HANDLE];
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
