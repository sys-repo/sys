import React, { useRef } from 'react';
import { type t, History, LocalStorage, Signal } from './common.ts';

type Storage = { docId?: string; history: string[] };
type StorageImmutable = t.LocalStorageImmutable<Storage>;

/**
 * Hook: manage storing current document-id's in local-storage.
 */
export function useLocalStorage(key: string | undefined, signal: t.Signal<string | undefined>) {
  const storeRef = useRef<StorageImmutable>();
  const historyRef = useRef<t.HistoryStack>();

  const createStack = () => {
    const store = storeRef.current;
    const items = store?.current.history;
    const stack = History.stack({ items });
    historyRef.current = stack;
    stack.onChange((e) => store?.change((d) => (d.history = e.after as string[])));
  };

  /**
   * Effect: setup local-store.
   */
  React.useEffect(() => {
    if (key) {
      const store = (storeRef.current = LocalStorage.immutable<Storage>(key, { history: [] }));
      createStack();

      // Sync stored values.
      if (signal.value && store.current.docId !== signal.value) {
        store.change((d) => (d.docId = signal.value));
      }
      if (store.current.docId !== signal.value) {
        signal.value = store.current.docId;
      }
    } else {
      // Reset:
      storeRef.current = undefined;
      createStack();
    }
  }, [key]);

  /**
   * Effect: save to local-storage when signal changes.
   */
  Signal.useEffect(() => {
    const store = storeRef.current;
    const value = signal.value;
    if (store && store.current.docId !== value) {
      store.change((d) => (d.docId = value));
    }
  });

  /**
   * Handlers:
   */
  const onArrowKey: t.TextInputKeyHandler = (e) => {
    e.cancel();
    const history = historyRef.current;

    if (!api.active || !history) return;
    if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;

    if (e.key === 'ArrowUp') {
      const prev = history.back(signal.value);
      if (prev) signal.value = prev;
    }
    if (e.key === 'ArrowDown') {
      if (e.modifiers.meta) {
        history.reset(); // ← reset to HEAD.
        signal.value = history.current;
      } else {
        const next = history.forward();
        if (next) signal.value = next;
      }
    }
  };

  /**
   * API:
   */
  const api = {
    handlers: { onArrowKey },
    get active() {
      return !!storeRef.current;
    },
    get history() {
      return historyRef.current!;
    },
  } as const;

  return api;
}
