import { type t, Is } from '../common.ts';

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
      try {
        data = JSON.parse(String(ev.data));
      } catch {
        // if it's already an object, just pass it through
      }
      for (const fn of listeners) fn({ data });
    };

    return {
      postMessage(data: unknown) {
        ws.send(JSON.stringify(data));
      },
      addEventListener(_type, handler) {
        listeners.add(handler);
      },
      start() {
        // no-op, here for MessagePort compatibility
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

/**
 * Helpers:
 */
const wrangle = {
  port(input: t.CmdMessagePort | WebSocket): t.CmdMessagePort {
    return Is.websocket(input) ? Fixture.portFromWebSocket(input) : (input as t.CmdMessagePort);
  },
} as const;
