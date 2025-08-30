import React, { useRef } from 'react';
import { type t, History, Kbd, LocalStorage, Signal } from './common.ts';

type Storage = { docId?: string; history: string[] };
type StorageImmutable = t.LocalStorageImmutable<Storage>;

/**
 * Hook: manage storing current document-id's in local-storage.
 */
export function useLocalStorage(args: {
  key: string | undefined;
  signal: t.Signal<string | undefined>;
  readOnly?: boolean;
}) {
  const { key, signal, readOnly } = args;

  const storeRef = useRef<StorageImmutable>(undefined);
  const historyRef = useRef<t.HistoryStack>(undefined);

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

      const stored = store.current.docId;
      const signalled = signal.value;

      // Initialize signal ←→ storage on first mount without clobbering durable state.
      if (!stored && signalled) {
        store.change((d) => (d.docId = signalled));
      } else if (stored && !signalled) {
        signal.value = stored;
      } else if (stored && signalled && stored !== signalled) {
        // Prefer durable local-storage over a stale signal (e.g., from a stale URL param).
        signal.value = stored;
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

    if (!api.active || !history || readOnly) return;
    if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;

    if (e.key === 'ArrowUp') {
      const prev = history.back(signal.value);
      if (prev) signal.value = prev;
    }
    if (e.key === 'ArrowDown') {
      if (Kbd.Is.command(e.modifiers)) {
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
