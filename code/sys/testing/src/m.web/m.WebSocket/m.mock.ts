import type { t } from '../common.ts';
import { FakeWebSocket } from './u.class.FakeWebSocket.ts';

export function mock(): t.WebFixture.WebSocket.Mock {
  const NativeWebSocket = globalThis.WebSocket;
  let disposed = false;

  Object.defineProperty(globalThis, 'WebSocket', {
    configurable: true,
    writable: true,
    value: FakeWebSocket,
  });

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      Object.defineProperty(globalThis, 'WebSocket', {
        configurable: true,
        writable: true,
        value: NativeWebSocket,
      });
    },
  };
}
