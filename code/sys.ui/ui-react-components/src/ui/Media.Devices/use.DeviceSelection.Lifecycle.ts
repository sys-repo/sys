import React from 'react';

import type { t } from './common.ts';
import { LocalStorage } from './common.ts';
import { selectDefaultDevice } from './u.selectDefault.ts';

/**
 * useDeviceSelectionLifecycle
 * - Restore from LocalStorage (optional), else derive default.
 * - Preserve selection by `deviceId` across churn.
 * - Persist `deviceId` when selection changes (if storageKey).
 * - Clear stored id if the device no longer exists.
 */
export const useDeviceSelectionLifecycle: t.UseDeviceSelectionLifecycle = (options) => {
  const { items, signal, prefs, storageKey, enabled = true } = options;

  // Store handle (optional):
  const store = React.useMemo(() => {
    if (!enabled || !storageKey) return;
    return LocalStorage.immutable<{ id?: string }>(storageKey, {});
  }, [enabled, storageKey]);

  /**
   * Init/default: restore from storage; else derive default.
   */
  React.useEffect(() => {
    if (!enabled) return;
    if (signal.value) return;

    const id = store?.current.id;
    if (id) {
      const found = items.find((d) => d.deviceId === id);
      if (found) return void (signal.value = found);
    }

    const idx = selectDefaultDevice(items, prefs);
    if (idx !== undefined) signal.value = items[idx];
  }, [enabled, store, items, prefs, signal]);

  /**
   * Reconcile storage: stored id exists but device disappeared → clear it.
   */
  React.useEffect(() => {
    if (!enabled || !store) return;
    const id = store.current.id;
    if (!id) return;
    const exists = items.some((d) => d.deviceId === id);
    if (!exists && store.current.id) store.change((s) => delete s.id);
  }, [enabled, store, items]);

  /**
   * Persist: on selection change, write/remove `deviceId`.
   */
  React.useEffect(() => {
    if (!enabled || !store) return;
    const id = signal.value?.deviceId;
    if (id) {
      if (store.current.id !== id) store.change((s) => (s.id = id));
    } else if (store.current.id) {
      store.change((s) => delete s.id);
    }
  }, [enabled, store, signal.value]);
};
