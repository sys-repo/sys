import { useEffect, useRef, useState } from 'react';
import { PatchState, R, type t } from '../common.ts';

type O = Record<string, unknown>;
type State<T extends O> = { data: T };

const defaultDiff: t.UseProxyDiff<O> = (prev, next) => R.equals(prev, next);

/**
 * Produces an immutable state proxy of the given
 * simple [data] object, and monitors for changes to
 * that underlying data property and uses that to reset
 * the immutable proxy.
 */
export function useProxy<T extends O>(
  object: T,
  diff: t.UseProxyDiff<T> = defaultDiff,
  reset?: number,
) {
  const proxyRef = useRef(wrangle.proxy(object));
  const stateRef = useRef(wrangle.state(proxyRef.current));
  const state = stateRef.current;

  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(object);
  const [version, setVersion] = useState(reset ?? 0);
  const incVersion = () => setVersion((n: number) => n + 1);

  /**
   * Increment version on external reset command.
   */
  useEffect(() => {
    if (ready) incVersion();
  }, [reset]);

  /**
   * Increment version on raw data/property diff.
   */
  const isDifferent = diff(current, object) ?? false;
  useEffect(() => {
    if (!ready) return;
    if (isDifferent) incVersion();
    setCurrent(object);
  }, [isDifferent]);

  /**
   * Reset proxy object when version increments.
   */
  useEffect(() => {
    if (!ready) return;
    proxyRef.current.change((d: State<T>) => (d.data = current));
  }, [version]);

  /**
   * Ready.
   */
  useEffect(() => setReady(true), []);

  /**
   * API
   */
  return {
    ready,
    version,
    object,
    state,
  } as const;
}

/**
 * Helpers
 */
const wrangle = {
  proxy<T extends O>(data: T): t.PatchState<State<T>, t.PatchStateEvents<T>> {
    return PatchState.create<State<T>, t.PatchStateEvents<T>>({ data });
  },

  state<T extends O>(
    proxy: t.PatchState<State<T>, t.PatchStateEvents<T>>,
  ): t.Immutable<T, t.PatchOperation> {
    return {
      change: (fn) => proxy.change((d) => fn(d.data)),
      get current() {
        return proxy.current.data;
      },
    } as const;
  },
} as const;
