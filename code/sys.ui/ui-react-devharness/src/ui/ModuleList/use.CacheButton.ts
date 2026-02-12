import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Http } from '@sys/http/client';
import { usePointer } from './common.ts';

type O = Record<string, unknown>;

export type UseCacheButton = () => {
  readonly isBusy: boolean;
  readonly isRunning: boolean;
  readonly isDisabled: boolean;
  readonly isDown: boolean;
  readonly isOver: boolean;
  readonly label: string;
  readonly handlers: O & { readonly onClick: () => void };
};

/**
 * Hook: state + handlers for the cache action button.
 */
export const useCacheButton: UseCacheButton = () => {
  const pointer = usePointer();
  const mountedRef = useRef(true);

  /**
   * Hooks: state
   */
  const [isBusy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [count, setCount] = useState<number | undefined>(undefined);

  /**
   * Behavior:
   */
  const fetchCount = useCallback(async () => {
    const result = await wrangle.info();
    if (!mountedRef.current) return;
    setCount(result && 'totals' in result ? result.totals.entries : undefined);
  }, []);

  const clear = useCallback(async () => {
    setBusy(true);
    try {
      await wrangle.clear();
      await fetchCount();
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [fetchCount]);

  useEffect(() => {
    mountedRef.current = true;
    void fetchCount();
    return () => void (mountedRef.current = false);
  }, [fetchCount]);

  const isRunning = count !== undefined;
  const isDisabled = isBusy || !isRunning;

  useEffect(() => {
    if (isDisabled) setConfirming(false);
  }, [isDisabled]);

  /**
   * Handlers:
   */
  const handlers = useMemo<O & { readonly onClick: () => void }>(() => {
    if (isDisabled) return { onClick: () => {} };

    const resetConfirm = () => setConfirming(false);
    const base = pointer.handlers as O;
    return {
      ...base,
      onClick: () => {
        if (isBusy) return;
        if (!confirming) return void setConfirming(true);
        setConfirming(false);
        void clear();
      },
      onPointerLeave: (event: unknown) => {
        resetConfirm();
        const fn = base.onPointerLeave;
        if (typeof fn === 'function') fn(event);
      },
      onBlur: (event: unknown) => {
        resetConfirm();
        const fn = base.onBlur;
        if (typeof fn === 'function') fn(event);
      },
    };
  }, [pointer.handlers, clear, confirming, isBusy, isDisabled]);

  const itemCount = count ?? '?';
  const label = !isRunning
    ? 'cache(not-running)'
    : confirming
      ? `clear ${itemCount} items from cache`
      : `cache(${itemCount})`;

  return {
    isBusy,
    isRunning,
    isDisabled,
    isDown: isDisabled ? false : pointer.is.down,
    isOver: isDisabled ? false : pointer.is.over,
    label,
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
