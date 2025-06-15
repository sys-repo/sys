import React, { useRef } from 'react';
import { type t, LocalStorage, Signal } from './common.ts';

type Storage = { docId?: string };
type StorageImmutable = t.LocalStorageImmutable<Storage>;

/**
 * Hook: manage storing current document-id's in local-storage.
 */
export function useLocalStorage(key: string | undefined, signal: t.Signal<string | undefined>) {
  const storeRef = useRef<StorageImmutable>();

  /**
   * Effect: setup local-store.
   */
  React.useEffect(() => {
    if (key) {
      const store = (storeRef.current = LocalStorage.immutable<Storage>(key, {}));

      // Sync stored values.
      if (signal.value && store.current.docId !== signal.value) {
        store.change((d) => (d.docId = signal.value));
      }
      if (store.current.docId !== signal.value) {
        signal.value = store.current.docId;
      }
    }
  }, [key]);

  /**
   * Effect: save in local-store when signal changes.
   */
  Signal.useEffect(() => {
    const store = storeRef.current;
    const id = signal.value;
    if (store && store.current.docId !== signal.value) {
      store.change((d) => (d.docId = signal.value));
    }
  });

  /**
   * API:
   */
  return {} as const;
}
