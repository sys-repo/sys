import { type t, Rx } from './common.ts';
import { CmdIs } from './m.Is.ts';
import { sameNamespace } from './u.namespace.ts';

type HostRuntimeOptions = t.CmdHostOptions & {
  readonly ns?: t.CmdNamespace;
};

type ActiveRequest = {
  readonly name: t.CmdName;
  readonly controller: AbortController;
};

/**
 * Create a command host bound to the given endpoint.
 */
export function makeHost<
  N extends string,
  P extends t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N>,
  E extends t.CmdPayloadEventMap<N> = t.CmdPayloadEventMap<N>,
>(
  endpoint: t.CmdEndpoint,
  handlers: t.CmdHandlers<N, P, R, E>,
  opts: HostRuntimeOptions = {},
): t.CmdHost {
  const { ns, closeEndpoint = false } = opts;
  const life = Rx.lifecycle();
  const active = new Map<t.CmdReqId, ActiveRequest>();

  const onMessage = async (event: MessageEvent) => {
    const msg = event.data;

    if (CmdIs.cancel(msg)) {
      if (!sameNamespace(msg.ns, ns)) return;
      cancelActive(msg.id, msg.reason);
      return;
    }

    if (!CmdIs.request(msg)) return;
    if (!sameNamespace(msg.ns, ns)) return;

    const id = msg.id;
    const name = msg.name as N;
    const handler = handlers[name];
    const controller = new AbortController();
    active.set(id, { name, controller });

    let payload: unknown;
    let error: string | undefined;

    try {
      if (!handler) throw new Error(`No handler registered for command "${name}".`);

      const ctx: t.CmdHandlerContext<N, E, N> = {
        id,
        name,
        ns,
        signal: controller.signal,
        emit(event) {
          if (controller.signal.aborted) return;
          if (active.get(id)?.controller !== controller) return;

          const envelope: t.CmdEventEnvelope = {
            kind: 'cmd:event',
            ns,
            id,
            name,
            payload: event,
          };
          endpoint.postMessage(envelope);
        },
      };

      payload = await handler(msg.payload as P[N], ctx);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const current = active.get(id);
    active.delete(id);

    if (controller.signal.aborted || current?.controller !== controller) return;

    const envelope: t.CmdResultEnvelope = {
      kind: 'cmd:result',
      ns,
      id,
      name,
      payload,
      error,
    };
    endpoint.postMessage(envelope);
  };

  /**
   * Lifecycle:
   */
  function teardown() {
    endpoint.removeEventListener('message', onMessage);

    for (const [id, item] of active.entries()) {
      active.delete(id);
      postHostDisposed(id, item.name);
      item.controller.abort('host-disposed');
    }

    if (closeEndpoint) endpoint.close?.();
  }

  /**
   * API:
   */
  endpoint.addEventListener('message', onMessage);
  endpoint.start?.();
  life.dispose$.subscribe(teardown);
  return Rx.toLifecycle<t.CmdHost>(life, {});

  /**
   * Helpers:
   */
  function cancelActive(id: t.CmdReqId, reason?: string) {
    const item = active.get(id);
    if (!item) return;

    active.delete(id);
    item.controller.abort(reason ?? 'cancelled');
  }

  function postHostDisposed(id: t.CmdReqId, name: t.CmdName) {
    const envelope: t.CmdResultEnvelope = {
      kind: 'cmd:result',
      ns,
      id,
      name,
      error: 'Command host disposed before response was sent.',
    };

    try {
      endpoint.postMessage(envelope);
    } catch {
      // Host disposal is terminal locally; remote settlement is best-effort if transport is failing.
    }
  }
}
