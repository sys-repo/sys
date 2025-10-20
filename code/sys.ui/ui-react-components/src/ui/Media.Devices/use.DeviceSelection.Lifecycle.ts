import React from 'react';
import type { t } from './common.ts';
import { LocalStorage } from './common.ts';
import { selectDefaultDevice } from './u.selectDefault.ts';

type Stored = { id?: string; kind?: MediaDeviceKind };

export const useDeviceSelectionLifecycle: t.UseDeviceSelectionLifecycle = (opts) => {
  const { items, selected, onSelect, storageKey, prefs, enabled = true, filter } = opts;

  // Use the same view as the UI list.
  const visible = React.useMemo(() => (filter ? items.filter(filter) : items), [items, filter]);

  // Raw read (no writer) to avoid clobbering on mount.
  const readStored = React.useCallback((): Stored | undefined => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Stored) : undefined;
    } catch {
      return undefined;
    }
  }, [storageKey]);

  // Lazy writer (created only when we need to write).
  const storeRef = React.useRef<ReturnType<typeof LocalStorage.immutable<Stored>>>();
  const getStore = React.useCallback(() => {
    if (!storageKey) return;
    if (!storeRef.current) {
      storeRef.current = LocalStorage.immutable<Stored>(storageKey, {} as Stored);
    }
    return storeRef.current;
  }, [storageKey]);

  const emit = React.useCallback(
    (idx: number) => {
      const info = visible[idx];
      if (info) onSelect?.({ info, index: idx as t.Index });
    },
    [visible, onSelect],
  );

  const resolveStoredIndex = React.useCallback((): number | undefined => {
    const snap = readStored();
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

    const order = (prefs?.kindOrder ??
      (['videoinput', 'audioinput', 'audiooutput'] as const)) as readonly MediaDeviceKind[];
    matches.sort((a, b) => order.indexOf(a.d.kind) - order.indexOf(b.d.kind));
    return matches[0].i;
  }, [readStored, visible, prefs?.kindOrder]);

  // Don’t clear anything until we’ve seen a non-empty list at least once.
  const seenNonEmptyRef = React.useRef(false);
  React.useEffect(() => {
    if (visible.length > 0) seenNonEmptyRef.current = true;
  }, [visible.length]);

  // 1) Seed from storage (or fallback) only when no selection yet.
  React.useEffect(() => {
    if (!enabled) return;
    if (selected) return;
    if (visible.length === 0) return;

    const fromStore = resolveStoredIndex();
    if (fromStore !== undefined) {
      emit(fromStore);
      return;
    }

    const fallback = selectDefaultDevice(visible, prefs);
    if (fallback !== undefined) emit(fallback);
  }, [enabled, visible, prefs, selected, resolveStoredIndex, emit]);

  // 2) If selected device disappears from the *visible* list, choose a new default.
  React.useEffect(() => {
    if (!enabled) return;
    if (!selected) return;
    if (visible.length === 0) return;

    const exists = visible.some(
      (d) => d.deviceId === selected.deviceId && d.kind === selected.kind,
    );
    if (exists) return;

    const fallback = selectDefaultDevice(visible, prefs);
    if (fallback !== undefined) emit(fallback);
  }, [enabled, visible, prefs, selected, emit]);

  // 3) Reconcile storage (only after first non-empty list). Clear only if the saved device truly no longer exists.
  React.useEffect(() => {
    if (!enabled) return;
    if (!storageKey) return;
    if (!seenNonEmptyRef.current) return;
    if (visible.length === 0) return;

    const snap = readStored();
    const id = snap?.id;
    const kind = snap?.kind;
    if (!id) return;

    const present = kind
      ? visible.some((d) => d.deviceId === id && d.kind === kind)
      : visible.some((d) => d.deviceId === id);

    if (!present) {
      const store = getStore();
      store?.change((s) => {
        delete s.id;
        delete (s as any).kind;
      });
    }
  }, [enabled, storageKey, visible, readStored, getStore]);

  // 4) Persist on selection change — IMPORTANT: do nothing if selected is undefined.
  React.useEffect(() => {
    if (!enabled) return;
    if (!storageKey) return;
    if (!selected) return; // ← this line fixes the “clear on mount” bug

    const store = getStore();
    if (!store) return;

    const id = selected.deviceId;
    const kind = selected.kind;
    const cur = store.current;

    if (cur.id !== id || cur.kind !== kind) {
      store.change((s) => {
        s.id = id;
        s.kind = kind;
      });
    }
  }, [enabled, storageKey, selected, getStore]);
};
