import { type t, createId, Rx } from './common.ts';
import { CmdIs } from './m.Is.ts';

/**
 * Internal: pending call entry (client side).
 */
type PendingEntry = {
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: unknown) => void;
};

/**
 * Create a command client bound to the given endpoint.
 */
export function createClient<
  N extends string,
  P extends t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N>,
>(endpoint: t.CmdEndpoint): t.CmdClient<N, P, R> {
  const life = Rx.lifecycle();
  const pending = new Map<string, PendingEntry>();

  const onMessage = (event: MessageEvent) => {
    const msg = event.data;
    if (!CmdIs.response(msg)) return;

    const entry = pending.get(msg.id);
    if (!entry) return;

    pending.delete(msg.id);

    if (msg.error) {
      entry.reject(new Error(msg.error));
    } else {
      entry.resolve(msg.payload);
    }
  };

  endpoint.addEventListener('message', onMessage);
  endpoint.start?.();

  const send: t.CmdClient<N, P, R>['send'] = (name, payload) => {
    const id = createId();
    const envelope: t.CmdEnvelope = {
      kind: 'cmd',
      id,
      name: name as t.CmdName,
      payload,
    };

    return new Promise<R[typeof name]>((resolve, reject) => {
      const entry: PendingEntry = {
        // Wrap to satisfy (unknown) → R[K] variance safely.
        resolve: (value) => resolve(value as R[typeof name]),
        reject,
      };
      pending.set(id, entry);
      endpoint.postMessage(envelope);
    });
  };

  /**
   * Lifecycle:
   */
  life.dispose$.subscribe(() => {
    endpoint.removeEventListener('message', onMessage);
    const error = new Error('Command client disposed before response was received.');
    for (const entry of pending.values()) {
      entry.reject(error);
    }
    pending.clear();
    endpoint.close?.();
  });

  /**
   * API:
   */
  const client = Rx.toLifecycle<t.CmdClient<N, P, R>>(life, { send });
  return client;
}
