import { type t, createId, Rx } from './common.ts';
import { CmdIs } from './m.Is.ts';

// Internal: pending call entry (client side).
type PendingEntry = {
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: unknown) => void;
};

// Internal: handle type for timeout timers.
type TimeoutHandle = ReturnType<typeof setTimeout>;

/**
 * Create a command client bound to the given endpoint.
 */
export function createClient<
  N extends string,
  P extends t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N>,
>(endpoint: t.CmdEndpoint, opts: t.CmdClientOptions = {}): t.CmdClient<N, P, R> {
  const { timeout } = opts;
  const life = Rx.lifecycle();

  const pending = new Map<t.CmdReqId, PendingEntry>();
  const timers = new Map<t.CmdReqId, TimeoutHandle>();

  const onMessage = (event: MessageEvent) => {
    const msg = event.data;
    if (!CmdIs.response(msg)) return;

    const id = msg.id as t.CmdReqId;
    const name = msg.name as t.CmdName;
    const entry = pending.get(id);
    if (!entry) return;

    pending.delete(id);

    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }

    if (msg.error) {
      entry.reject(
        makeError({
          kind: 'CmdErrorRemote',
          message: msg.error,
          meta: { name, id },
        }),
      );
    } else {
      entry.resolve(msg.payload);
    }
  };

  const send: t.CmdClient<N, P, R>['send'] = (name, payload) => {
    const id = createId();
    const envelope: t.CmdEnvelope = { kind: 'cmd', id, name, payload };

    return new Promise<R[typeof name]>((resolve, reject) => {
      const entry: PendingEntry = {
        // Wrap to satisfy (unknown) → R[K] variance safely.
        resolve: (value) => resolve(value as R[typeof name]),
        reject,
      };
      pending.set(id, entry);

      if (timeout !== undefined) {
        function onTimeout() {
          timers.delete(id);
          const pendingEntry = pending.get(id);
          if (!pendingEntry) return;

          pending.delete(id);
          const error = makeError({
            kind: 'CmdErrorTimeout',
            message: `Command "${name}" timed out after ${timeout}ms.`,
            meta: { name, id },
          });
          pendingEntry.reject(error);
        }

        const handle: TimeoutHandle = setTimeout(onTimeout, timeout);
        timers.set(id, handle);
      }

      endpoint.postMessage(envelope);
    });
  };

  /**
   * Lifecycle:
   */
  function teardown() {
    endpoint.removeEventListener('message', onMessage);

    for (const handle of timers.values()) {
      clearTimeout(handle);
    }

    const error = makeError({
      kind: 'CmdErrorClientDisposed',
      message: 'Command client disposed before response was received.',
    });
    for (const entry of pending.values()) {
      entry.reject(error);
    }

    pending.clear();
    endpoint.close?.();
  }

  /**
   * API:
   */
  endpoint.addEventListener('message', onMessage);
  endpoint.start?.();
  const client = Rx.toLifecycle<t.CmdClient<N, P, R>>(life, { send });
  life.dispose$.subscribe(teardown);
  return client;
}

/**
 * Helpers:
 */
const makeError = (args: {
  readonly kind: t.CmdErrorKind;
  readonly message: string;
  readonly meta?: t.CmdErrorMeta;
}): t.CmdError => {
  const { kind, message, meta } = args;
  const err = new Error(message) as t.CmdError;
  err.name = kind;
  if (meta) err.cmd = meta;
  return err;
};
