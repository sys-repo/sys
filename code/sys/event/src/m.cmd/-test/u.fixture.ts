import { type t, Json } from '../common.ts';

/**
 * Test utilities for wrapping WebSocket → MessagePort → CmdEndpoint.
 */
export const Fixture = {
  /**
   * Wrap a WebSocket in a MessagePort-like interface.
   */
  portFromWebSocket(ws: WebSocket): t.CmdMessagePort {
    const listeners = new Set<(event: { data: unknown }) => void>();

    ws.onmessage = (ev) => {
      let data: unknown = ev.data;
      const parsed = Json.safeParse<unknown>(String(ev.data));
      if (parsed.ok) data = parsed.data;

      for (const fn of listeners) fn({ data });
    };

    return {
      postMessage(data: unknown) {
        ws.send(Json.stringify(data));
      },
      addEventListener(_type, handler) {
        listeners.add(handler);
      },
      start() {
        // No-op, here for MessagePort compatibility.
      },
      close() {
        ws.close();
      },
    };
  },

  /**
   * Wait for WebSocket to be open.
   */
  waitForOpen(ws: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = (err) => reject(err);
    });
  },
} as const;
