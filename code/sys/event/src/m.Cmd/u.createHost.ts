import { type t, Rx } from './common.ts';
import { CmdIs } from './m.Is.ts';

/**
 * Create a command host bound to the given endpoint.
 */
export function createHost<
  N extends string,
  P extends t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N>,
>(endpoint: t.CmdEndpoint, handlers: t.CmdHandlers<N, P, R>): t.CmdHost {
  const life = Rx.abortable();

  const onMessage = async (event: MessageEvent) => {
    const msg = event.data;
    if (!CmdIs.request(msg)) return;

    const { id, name, payload } = msg;

    const handler = handlers[name as N];
    let resultPayload: unknown;
    let error: string | undefined;

    try {
      if (!handler) throw new Error(`No handler registered for command "${name}".`);
      resultPayload = await handler(payload as P[N]);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const envelope: t.CmdResultEnvelope = {
      kind: 'cmd:result',
      id,
      name,
      payload: resultPayload,
      error,
    };

    endpoint.postMessage(envelope);
  };

  endpoint.addEventListener('message', onMessage);
  endpoint.start?.();

  /**
   * Lifecycle:
   */
  life.dispose$.subscribe(() => {
    endpoint.removeEventListener('message', onMessage);
    endpoint.close?.();
  });

  /**
   * API:
   */
  const host = Rx.toLifecycle<t.CmdHost>(life, {});
  return host;
}
