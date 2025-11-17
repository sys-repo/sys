import { useEffect, useState } from 'react';
import { type t, Is, LocalStorage, useRev } from './common.ts';

type P = t.RepoSyncSwitchProps;
type Store = { syncEnabled?: boolean };

export function useController(props: P) {
  const { repo, localstorage } = props;

  /**
   * Hooks:
   */
  const [store, setStore] = useState(wrangle.localstore(props));
  const [enabled, setEnabled] = useState<boolean | null>(wrangle.enabled(store?.current, repo));
  const [peers, setPeers] = useState<readonly t.PeerId[]>([]);
  const [pending, setPending] = useState(false);
  const [, bump] = useRev();

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
   *  - treat any props/change as a potential sync.enabled change (since the
   *    canonical value is always present on the props payload).
   */
  useEffect(() => {
    if (!repo) return;

    const events = repo.events();
    events.$.subscribe(bump);
    events.prop$.subscribe((e) => {
      const next = Is.bool(e.after.sync.enabled)
        ? e.after.sync.enabled
        : Is.bool(repo.sync.enabled)
          ? (repo.sync.enabled as boolean)
          : null;

      setEnabled(next);
      setPending(false);
    });

    // Initial sync: repo/localstore → enabled (and repo if localstore overrides).
    updatedEnabled(wrangle.enabled(store?.current, repo));

    return events.dispose;
  }, [repo?.id.instance]);

  /**
   * Monitor peers:
   */
  useEffect(() => {
    setPeers(repo?.sync.peers ?? []);
  }, [repo?.id.instance, repo?.sync.peers.join()]);

  /**
   * Methods:
   */
  /** Only forward to repo when next is boolean; null = no adapters (no-op). */
  const updatedEnabled = (next: boolean | null) => {
    setEnabled(next);

    if (!repo || !Is.bool(next)) {
      // No repo or no concrete value: treat as "no adapters" / no-op.
      setPending(false);
      return;
    }

    const current = repo.sync.enabled;
    if (current === next) {
      // Already in desired state: no command, no pending.
      setPending(false);
      return;
    }

    // Real state transition: mark pending and send command.
    setPending(true);
    repo.sync.enable(next);
  };

  /**
   * API:
   */
  return {
    enabled,
    updatedEnabled,
    peers,
    pending,
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
