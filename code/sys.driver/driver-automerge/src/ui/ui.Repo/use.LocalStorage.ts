import React, { useRef } from 'react';
import { type t, History, LocalStorage, Signal, D } from './common.ts';
import { signal } from '@preact/signals-core';

type Storage = { syncEnabled?: boolean };
type StorageImmutable = t.LocalStorageImmutable<Storage>;

/**
 * Hook: manage persisting settings in local-storage
 */
export function useLocalStorage(args: t.UseRepoHookArgs) {
  const key = args.localstorageKey;
  const signals = args.signals;
  const storeRef = useRef<StorageImmutable>();

  console.log('storeRef.current?.current', storeRef.current?.current);

  /**
   * Effect: setup local-store.
   */
  React.useEffect(() => {
    if (key) {
      const store = (storeRef.current = LocalStorage.immutable<Storage>(key, {}));
      // createStack();

      console.log('key', key);
      console.log('store.current', store.current);

      // Sync stored values.
      if (signals?.syncEnabled) {
        if (signals.syncEnabled?.value !== store.current.syncEnabled) {
          store.change((d) => (d.syncEnabled = signals?.syncEnabled?.value));
        }
        if (store.current.syncEnabled !== signals?.syncEnabled?.value) {
          signals.syncEnabled.value = store.current.syncEnabled;
        }
      }

      // if (signal.value && store.current.docId !== signal.value) {
      //   store.change((d) => (d.docId = signal.value));
      // }

      // if (signal.value && store.current.docId !== signal.value) {
      //   store.change((d) => (d.docId = signal.value));
      // }
      // if (store.current.docId !== signal.value) {
      //   signal.value = store.current.docId;
      // }
    } else {
      // Reset:
      storeRef.current = undefined;
    }
  }, [key, !!signals]);

  /**
   * Effect: save to local-storage when signal changes.
   */
  Signal.useEffect(() => {
    const store = storeRef.current;
    const value = signals?.syncEnabled?.value ?? D.syncEnabled;
    if (store && store.current.syncEnabled !== value) {
      store.change((d) => (d.syncEnabled = value));
    }
  });

  console.log('storeRef.current?.current', storeRef.current?.current);

  /**
   * Handlers:
   */

  /**
   * API:
   */
  const api = {
    get active() {
      return !!storeRef.current;
    },
  } as const;

  return api;
}
