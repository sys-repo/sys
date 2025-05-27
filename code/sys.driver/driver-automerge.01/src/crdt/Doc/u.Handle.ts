import { eventsFactory } from './Doc.Events.ts';
import { Symbols, slug, toObject, type t } from './common.ts';
import { Wrangle } from './u.Wrangle.ts';

type O = Record<string, unknown>;

/**
 * Convert a Doc<T> → DocWithHandle<T>.
 */
export function toHandle<T extends O>(doc: t.Doc<T>): t.DocHandle<T> {
  return (doc as t.DocWithHandle<T>).handle;
}

export const Handle = {
  toHandle,

  /**
   * Wrap a raw automerge document-handle as a [DocWithHandle].
   */
  wrap<T extends O>(
    handle: t.DocHandle<unknown>,
    options: { dispose$?: t.UntilObservable } = {},
  ): t.DocWithHandle<T> {
    const api: t.DocWithHandle<T> = {
      instance: slug(),
      uri: handle.url,
      handle: handle as t.DocHandle<T>,
      is: {
        get ready() {
          return handle.isReady();
        },
        get deleted() {
          return handle.isDeleted();
        },
      },
      get current() {
        if (!api.is.ready) return {} as T; // NB: edge-case (only happens when disposed).
        return handle.docSync() as T;
      },
      change(fn, options) {
        if (!api.is.ready) return; // NB: edge-case (only happens when disposed).
        handle.change((d: any) => fn(d), Wrangle.changeOptions(options));
      },
      events(dispose$) {
        return eventsFactory<T>(api, { dispose$: [options.dispose$, dispose$] });
      },
      toObject() {
        return toObject<T>(api.current);
      },
    };

    (api as any)[Symbols.kind] = Symbols.Doc;
    return api;
  },
} as const;
