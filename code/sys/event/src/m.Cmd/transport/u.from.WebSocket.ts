import { type t } from '../common.ts';

/**
 * Adapt a WebSocket into a CmdEndpoint using JSON-encoded messages.
 *
 * Outbound messages are sent with `JSON.stringify`, and inbound messages are
 * parsed with `JSON.parse` when possible. Parsed values are delivered to
 * listeners as `MessageEvent` instances carrying the decoded `data`.
 */
export function fromWebSocket(ws: WebSocket): t.CmdEndpoint {
  const listeners = new Set<(event: MessageEvent) => void>();

  ws.onmessage = (ev) => {
    let data: unknown = ev.data;
    try {
      data = JSON.parse(String(ev.data));
    } catch {
      // Non-JSON payloads are passed through unchanged.
    }

    const message = new MessageEvent('message', { data });
    for (const fn of listeners) fn(message);
  };

  type H = (event: MessageEvent) => void;
  return {
    postMessage: (data: unknown) => ws.send(JSON.stringify(data)),
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
