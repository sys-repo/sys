import { useEffect, useState } from 'react';
import { type t, LocalStorage } from './common.ts';

type P = t.SyncEnabledSwitchProps;
type Store = { syncEnabled?: boolean };

export function useController(props: P) {
  const { repo, localstorage } = props;

  /**
   * Hooks:
   */
  const [store, setStore] = useState(wrangle.localstore(props));
  const [enabled, setEnabled] = useState(wrangle.enabled(store?.current, repo));

  /**
   * Effect: refresh local-store handle when the storage key changes.
   */
  useEffect(() => void setStore(wrangle.localstore(props)), [localstorage]);

  /**
   * Effect: persist changes made by this hook back to local-storage.
   */
  useEffect(() => {
    store?.change((d) => (d.syncEnabled = enabled));
  }, [store, enabled]);

  /**
   * Effect: keep `enabled` in-sync with repo‐side toggles done elsewhere.
   */
  useEffect(() => {
    const events = repo?.events();
    events?.$.subscribe((e) => {
      const next = e.after.sync.enabled;
      if (e.before.sync.enabled !== next) updatedEnabled(next);
    });
    updatedEnabled(wrangle.enabled(store?.current, repo));
    return events?.dispose;
  }, [repo?.id.instance]);

  /**
   * Methods:
   */
  const updatedEnabled = (enabled: boolean) => {
    setEnabled(!!repo && enabled);
    if (repo) repo.sync.enabled = enabled;
  };

  /**
   * API:
   */
  return {
    enabled,
    updatedEnabled,
  } as const;
}

/**
 * Helpers:
 */
const wrangle = {
  localstore(props: P) {
    const { repo, localstorage } = props;
    const syncEnabled = repo?.sync.enabled ?? false;
    if (!localstorage) return;
    else return LocalStorage.immutable<Store>(localstorage, { syncEnabled });
  },

  enabled(store?: Store, repo?: t.CrdtRepo) {
    return store?.syncEnabled ?? repo?.sync.enabled ?? false;
  },
} as const;
