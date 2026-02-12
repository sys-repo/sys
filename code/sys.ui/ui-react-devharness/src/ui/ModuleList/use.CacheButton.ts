import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Http } from '@sys/http/client';
import { usePointer } from './common.ts';

export type UseCacheButton = () => {
  readonly isBusy: boolean;
  readonly isDown: boolean;
  readonly isOver: boolean;
  readonly label: string;
  readonly handlers: Record<string, unknown> & { readonly onClick: () => void };
};

/**
 * Hook: state + handlers for the cache action button.
 */
export const useCacheButton: UseCacheButton = () => {
  const pointer = usePointer();
  const mountedRef = useRef(true);
  const [isBusy, setBusy] = useState(false);
  const [count, setCount] = useState<number | undefined>(undefined);

  const fetchCount = useCallback(async () => {
    const result = await wrangle.info();
    if (!mountedRef.current) return;
    setCount(result && 'totals' in result ? result.totals.entries : undefined);
  }, []);

  const clear = useCallback(async () => {
    if (isBusy) return;
    setBusy(true);
    try {
      await wrangle.clear();
      await fetchCount();
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [fetchCount, isBusy]);

  useEffect(() => {
    mountedRef.current = true;
    void fetchCount();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchCount]);

  const handlers = useMemo(
    () => ({ ...pointer.handlers, onClick: () => void clear() }),
    [pointer.handlers, clear],
  );

  return {
    isBusy,
    isDown: pointer.is.down,
    isOver: pointer.is.over,
    label: `cache(${count ?? '-'})`,
    handlers,
  };
};

/**
 * Helpers:
 */
const wrangle = {
  async clear() {
    return await wrangle.send(Http.Cache.Cmd.CLEAR, { scope: 'pkg' });
  },

  async info() {
    return await wrangle.send(Http.Cache.Cmd.INFO, { scope: 'pkg' });
  },

  async send(name: 'http.cache.clear' | 'http.cache.info', payload: { scope: 'pkg' }) {
    if (!('serviceWorker' in navigator)) return undefined;

    const reg = await navigator.serviceWorker.ready.catch(() => undefined);
    const sw = navigator.serviceWorker.controller ?? reg?.active;
    if (!sw) return undefined;

    const channel = new MessageChannel();
    const cmd = Http.Cache.Cmd.make();
    const client = cmd.client(channel.port1);

    try {
      sw.postMessage({ kind: Http.Cache.Cmd.CONNECT }, [channel.port2]);
      return await client.send(name, payload);
    } catch {
      return undefined;
    } finally {
      client.dispose();
      channel.port1.close();
    }
  },
} as const;
