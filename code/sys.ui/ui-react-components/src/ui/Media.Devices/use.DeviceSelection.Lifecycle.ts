import React from 'react';
import { type t, LocalStorage } from './common.ts';
import { selectDefaultDevice } from './u.selectDefault.ts';

/**
 * Storage shape:
 */
type Stored = {
  id?: string;
  kind?: MediaDeviceKind;
  label?: string;
  groupId?: string;
  ts?: number; // last persisted timestamp (diagnostic)
};
type Store = t.LocalStorageImmutable<Stored>;
const makeStore = (key?: string) => (key ? LocalStorage.immutable<Stored>(key, {}) : undefined);

export const useDeviceSelectionLifecycle: t.UseDeviceSelectionLifecycle = (opts) => {
  const { items, selected, onResolve, storageKey, prefs, enabled = true } = opts;

  /**
   * Memoize:
   */
  const store = React.useMemo<Store | undefined>(() => makeStore(storageKey), [storageKey]);

  /**
   * Helpers:
   */
  const emit = React.useCallback(
    (index: t.Index) => {
      const device = items[index];
      if (device) onResolve?.({ device, index });
    },
    [items, onResolve],
  );

  /**
   * Try to find the stored device within the current items using precise strategies:
   *   1) id + kind (exact)
   *   2) groupId + kind
   *   3) id-only with disambiguation via prefs.kindOrder
   */
  const resolveStoredIndex = React.useCallback((): number | undefined => {
    const snap = store?.current;
    if (!snap) return;

    const { id, kind, groupId } = snap;

    // 1. Exact: id + kind:
    if (id && kind) {
      const i = items.findIndex((d) => d.deviceId === id && d.kind === kind);
      if (i >= 0) return i;
    }

    // 2. groupId + kind:
    if (groupId && kind) {
      const i = items.findIndex((d) => (d as any).groupId === groupId && d.kind === kind);
      if (i >= 0) return i;
    }

    // 3. id-only with kindOrder disambiguation:
    if (id) {
      const matches = items.map((d, i) => ({ d, i })).filter(({ d }) => d.deviceId === id);
      if (matches.length === 0) return;
      if (matches.length === 1) return matches[0].i;

      const order = prefs?.kindOrder ?? ['videoinput', 'audioinput', 'audiooutput'];
      matches.sort((a, b) => order.indexOf(a.d.kind) - order.indexOf(b.d.kind));
      return matches[0].i;
    }

    return;
  }, [store, items, prefs?.kindOrder]);

  /**
   * Effect: Bootstrap selection from storage or fallback (only when none selected yet).
   */
  React.useEffect(() => {
    if (!enabled) return;
    if (selected) return;
    if (items.length === 0) return;

    const fromStore = resolveStoredIndex();
    if (fromStore !== undefined) {
      emit(fromStore);
      return;
    }

    const fallback = selectDefaultDevice(items, prefs);
    if (fallback !== undefined) emit(fallback);
  }, [enabled, items, prefs, selected, resolveStoredIndex, emit]);

  /**
   * Effect: If current selection disappears from the list, choose a working fallback.
   * (Do NOT clear storage; keep the last known-good persisted choice.)
   */
  React.useEffect(() => {
    if (!enabled) return;
    if (!selected) return;
    if (items.length === 0) return;

    const { deviceId, kind } = selected;
    const exists = items.some((d) => d.deviceId === deviceId && d.kind === kind);
    if (exists) return;

    const fallback = selectDefaultDevice(items, prefs);
    if (fallback !== undefined) emit(fallback);
  }, [enabled, items, prefs, selected, emit]);

  /**
   * Effect: Persist on selection change (enrich with label & groupId; never wipe).
   */
  React.useEffect(() => {
    if (!enabled) return;
    if (!store) return;
    if (!selected) return;

    const id = selected.deviceId;
    const kind = selected.kind;
    const label = selected.label;
    const groupId = (selected as any).groupId as string | undefined;

    const cur = store.current;
    const changed =
      cur.id !== id || cur.kind !== kind || cur.label !== label || cur.groupId !== groupId;

    if (changed) {
      store.change((s) => {
        s.id = id;
        s.kind = kind;
        s.label = label;
        s.groupId = groupId;
        s.ts = Date.now();
      });
    }
  }, [enabled, store, selected]);
};
