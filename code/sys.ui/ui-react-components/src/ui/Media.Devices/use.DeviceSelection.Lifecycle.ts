import React from 'react';

import type { t } from './common.ts';
import { LocalStorage } from './common.ts';
import { selectDefaultDevice } from './u.selectDefault.ts';

type Stored = { id?: string; kind?: MediaDeviceKind };
type Store = t.LocalStorageImmutable<Stored>;
const makeStore = (key?: string) => (key ? LocalStorage.immutable<Stored>(key, {}) : undefined);

export const useDeviceSelectionLifecycle: t.UseDeviceSelectionLifecycle = (opts) => {
  const { items, selected, onResolve, storageKey, prefs, enabled = true, filter } = opts;

  /**
   * Memoize:
   */
  const visible = React.useMemo(() => (filter ? items.filter(filter) : items), [items, filter]);
  const store = React.useMemo<Store | undefined>(() => makeStore(storageKey), [storageKey]);

  /**
   * Helpers:
   */
  const emit = React.useCallback(
    function (index: t.Index) {
      const device = visible[index];
      if (device) onResolve?.({ device, index });
    },
    [visible, onResolve],
  );

  const resolveStoredIndex = React.useCallback((): number | undefined => {
    const snap = store?.current;
    const id = snap?.id;
    const kind = snap?.kind;
    if (!id) return;

    // Exact match {kind,id}
    if (kind) {
      const k = visible.findIndex((d) => d.deviceId === id && d.kind === kind);
      if (k >= 0) return k;
    }

    // id-only fallback, disambiguate by prefs.kindOrder
    const matches = visible.map((d, i) => ({ d, i })).filter(({ d }) => d.deviceId === id);
    if (matches.length === 0) return;
    if (matches.length === 1) return matches[0].i;

    const order = prefs?.kindOrder ?? ['videoinput', 'audioinput', 'audiooutput'];
    matches.sort((a, b) => order.indexOf(a.d.kind) - order.indexOf(b.d.kind));
    return matches[0].i;
  }, [store, visible, prefs?.kindOrder]);

  /**
   * Effect: Do not clear anything until we've seen a non-empty list at least once.
   */
  const seenNonEmptyRef = React.useRef(false);
  React.useEffect(() => {
    if (visible.length > 0) seenNonEmptyRef.current = true;
  }, [visible.length]);

  /**
   * Effect: Seed from storage (or fallback) only when no selection yet.
   */
  React.useEffect(() => {
    if (!enabled) return;
    if (selected) return;
    if (visible.length === 0) return;

    const fromStore = resolveStoredIndex();
    if (fromStore !== undefined) return void emit(fromStore);

    const fallback = selectDefaultDevice(visible, prefs);
    if (fallback !== undefined) emit(fallback);
  }, [enabled, visible, prefs, selected, resolveStoredIndex, emit]);

  /**
   * Effect: If selected device disappears from the visible list, choose a new default.
   */
  React.useEffect(() => {
    if (!enabled) return;
    if (!selected) return;
    if (visible.length === 0) return;

    const { deviceId, kind } = selected;
    const exists = visible.some((d) => d.deviceId === deviceId && d.kind === kind);
    if (exists) return;

    const fallback = selectDefaultDevice(visible, prefs);
    if (fallback !== undefined) emit(fallback);
  }, [enabled, visible, prefs, selected, emit]);

  /**
   * Effect: Reconcile storage (only after first non-empty list).
   * Clear only if the saved device truly no longer exists.
   */
  React.useEffect(() => {
    if (!enabled) return;
    if (!store) return;
    if (!seenNonEmptyRef.current) return;
    if (visible.length === 0) return;

    const snap = store.current;
    const id = snap.id;
    const kind = snap.kind;
    if (!id) return;

    const present = kind
      ? visible.some((d) => d.deviceId === id && d.kind === kind)
      : visible.some((d) => d.deviceId === id);

    if (!present) {
      store.change((s) => {
        delete s.id;
        delete s.kind;
      });
    }
  }, [enabled, store, visible]);

  /**
   * Effect: Persist on selection change.
   */
  React.useEffect(() => {
    if (!enabled) return;
    if (!store) return;
    if (!selected) return;

    const id = selected.deviceId;
    const kind = selected.kind;
    const cur = store.current;

    if (cur.id !== id || cur.kind !== kind) {
      store.change((s) => {
        s.id = id;
        s.kind = kind;
      });
    }
  }, [enabled, store, selected]);
};
