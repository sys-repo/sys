import { type t, Rx } from './common.ts';
import { CmdIs } from './m.Is.ts';

/**
 * Create a command host bound to the given endpoint.
 */
export function makeHost<
  N extends string,
  P extends t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N>,
>(
  endpoint: t.CmdEndpoint,
  handlers: t.CmdHandlers<N, P, R>,
  opts: { ns?: t.CmdNamespace } = {},
): t.CmdHost {
  const { ns } = opts;
  const life = Rx.abortable();

  const onMessage = async (event: MessageEvent) => {
    const msg = event.data;
    if (!CmdIs.request(msg)) return;

    // Ignore commands for other namespaces, if configured.
    if (ns !== undefined && msg.ns !== ns) return;

    const id = msg.id as t.CmdReqId;
    const name = msg.name as t.CmdName;
    const messagePayload = msg.payload as P[N];

    const handler = handlers[name as N];
    let payload: unknown;
    let error: string | undefined;

    try {
      if (!handler) throw new Error(`No handler registered for command "${name}".`);
      payload = await handler(messagePayload);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

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
    endpoint.close?.();
  }

  /**
   * API:
   */
  endpoint.addEventListener('message', onMessage);
  endpoint.start?.();
  life.dispose$.subscribe(teardown);
  const host = Rx.toLifecycle<t.CmdHost>(life, {});
  return host;
}
