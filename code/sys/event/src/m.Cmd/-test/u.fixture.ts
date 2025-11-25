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

  /**
   * Create a CmdEndpoint adapter over a MessagePort-like transport.
   */
  toEndpoint(input: t.CmdMessagePort | WebSocket): t.CmdEndpoint {
    const portLike = wrangle.port(input);
    const listeners = new Set<(event: MessageEvent) => void>();

    portLike.addEventListener('message', (event: unknown) => {
      const ev = event as MessageEvent;
      for (const fn of listeners) fn(ev);
    });

    type H = (event: MessageEvent) => void;
    return {
      postMessage: (data: unknown) => portLike.postMessage(data),
      addEventListener: (_type: 'message', handler: H) => listeners.add(handler),
      removeEventListener: (_type: 'message', handler: H) => listeners.delete(handler),
      start: portLike.start,
      close: portLike.close,
    };
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
