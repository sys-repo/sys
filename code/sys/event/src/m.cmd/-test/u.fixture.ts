import { type t } from '../common.ts';

/**
 * General Cmd test helpers.
 */
export const Fixture = {
  /**
   * Wrap a MessagePort and count explicit close calls.
   */
  trackEndpoint(port: MessagePort) {
    let closed = 0;

    return {
      postMessage(data: unknown) {
        port.postMessage(data);
      },
      addEventListener(type: 'message', handler: (event: MessageEvent) => void) {
        port.addEventListener(type, handler);
      },
      removeEventListener(type: 'message', handler: (event: MessageEvent) => void) {
        port.removeEventListener(type, handler);
      },
      start() {
        port.start();
      },
      close() {
        closed += 1;
        port.close();
      },
      closed: () => closed,
    } satisfies t.Cmd.Endpoint & { readonly closed: () => number };
  },

  /**
   * Resolve after `tick` has been called `target` times.
   */
  waitForCount(target: number) {
    let count = 0;
    let complete: () => void = () => {};
    const done = new Promise<void>((resolve) => {
      complete = resolve;
    });

    return {
      done,
      tick() {
        count += 1;
        if (count === target) complete();
      },
    } as const;
  },

  /**
   * Resolve and remove a named pending resolver.
   */
  resolvePending<K, V>(pending: Map<K, (value: V) => void>, key: K, value: V) {
    const resolve = pending.get(key);
    if (!resolve) throw new Error(`Missing pending resolver for ${String(key)}.`);

    pending.delete(key);
    resolve(value);
  },
} as const;
