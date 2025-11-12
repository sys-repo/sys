import { useEffect, useState } from 'react';
import { type t, Is, LocalStorage, Rx } from './common.ts';

type P = t.SyncEnabledSwitchProps;
type Store = { syncEnabled?: boolean };

export function useController(props: P) {
  const { repo, localstorage } = props;

  /**
   * Hooks:
   */
  const [store, setStore] = useState(wrangle.localstore(props));
  const [enabled, setEnabled] = useState<boolean | null>(wrangle.enabled(store?.current, repo));
  const [peers, setPeers] = useState<readonly t.PeerId[]>([]);
  const [, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);

  /**
   * Effect: refresh local-store handle when the storage key changes.
   */
  useEffect(() => void setStore(wrangle.localstore(props)), [localstorage]);

  /**
   * Effect: persist changes made by this hook back to local-storage.
   */
  useEffect(() => {
    store?.change((d) => (d.syncEnabled = Is.bool(enabled) ? enabled : undefined));
  }, [store, enabled]);

  /**
   * Effect:
   *  - keep `enabled` in-sync with repo‐side toggles done elsewhere.
   */
  useEffect(() => {
    const events = repo?.events();
    events?.$.subscribe(redraw);
    events?.prop$.pipe(Rx.filter((e) => e.prop === 'sync.enabled')).subscribe((e) => {
      const next = e.after.sync.enabled;
      if (e.before.sync.enabled !== next) updatedEnabled(next);
    });

    updatedEnabled(wrangle.enabled(store?.current, repo));
    return events?.dispose;
  }, [repo?.id.instance]);

  /**
   * Monitor peers:
   */
  useEffect(() => {
    const peers = (repo?.sync.peers ?? []) as readonly t.PeerId[];
    setPeers(peers);
  }, [repo?.id.instance, repo?.sync.peers.join()]);

  /**
   * Methods:
   */
  /** Only forward to repo when next is boolean; null = no adapters (no-op). */
  const updatedEnabled = (next: boolean | null) => {
    setEnabled(next);
    if (repo && Is.bool(next)) repo.sync.enable(next);
  };

  /**
   * API:
   */
  return {
    enabled,
    updatedEnabled,
    peers,
  } as const;
}

/**
 * Helpers:
 */
const wrangle = {
  localstore(props: P) {
    const { repo, localstorage } = props;
    const syncEnabled = Is.bool(repo?.sync.enabled) ? repo.sync.enabled : undefined;
    if (!localstorage) return;
    else return LocalStorage.immutable<Store>(localstorage, { syncEnabled });
  },

  enabled(store?: Store, repo?: t.CrdtRepo) {
    return store?.syncEnabled ?? repo?.sync.enabled ?? null;
  },
} as const;
