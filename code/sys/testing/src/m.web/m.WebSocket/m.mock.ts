import type { t } from './common.ts';
import { Property } from '../m.Property/mod.ts';
import { FakeWebSocket } from './u.class.FakeWebSocket.ts';

/**
 * Replace `globalThis.WebSocket` with the minimal `FakeWebSocket` subset until disposal.
 *
 * Open and close transitions run on microtasks; messages, protocols, and `CloseEvent` metadata are
 * not modeled. Successful disposal restores the exact prior descriptor. Incomplete disposal throws
 * a retryable Property cleanup error.
 */
export function mock(): t.WebFixture.WebSocket.Mock {
  return Property.mock([
    {
      target: globalThis,
      key: 'WebSocket',
      descriptor: {
        configurable: true,
        writable: true,
        value: FakeWebSocket,
      },
    },
  ]);
}
