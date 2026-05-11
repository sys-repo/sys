import { type t, Json } from '../common.ts';

/**
 * Adapt a WebSocket into a CmdEndpoint using JSON-encoded messages.
 *
 * Outbound messages are sent with `Json.stringify`, and inbound messages are
 * parsed with `Json.safeParse` when possible. Parsed values are delivered to
 * listeners as `MessageEvent` instances carrying the decoded `data`.
 */
export function fromWebSocket(ws: WebSocket): t.CmdEndpoint {
  const listeners = new Set<(event: MessageEvent) => void>();

  ws.onmessage = (ev) => {
    let data: unknown = ev.data;
    const parsed = Json.safeParse<unknown>(String(ev.data));
    if (parsed.ok) data = parsed.data;

    const message = new MessageEvent('message', { data });
    for (const fn of listeners) fn(message);
  };

  type H = (event: MessageEvent) => void;
  return {
    postMessage: (data: unknown) => ws.send(Json.stringify(data, 0)),
    addEventListener: (_type: 'message', handler: H) => listeners.add(handler),
    removeEventListener: (_type: 'message', handler: H) => listeners.delete(handler),
    start() {
      // No-op: WebSocket is already active once open. Included for CmdEndpoint shape.
    },
    close() {
      ws.close();
    },
  };
}
