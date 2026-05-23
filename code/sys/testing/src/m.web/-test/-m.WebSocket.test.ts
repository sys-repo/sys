import { describe, expect, it } from '../../-test.ts';
import { WebFixture } from '../mod.ts';

describe('WebFixture.WebSocket', () => {
  it('mock replaces globalThis.WebSocket until disposed', async () => {
    const NativeWebSocket = globalThis.WebSocket;
    const mock = WebFixture.WebSocket.mock();

    try {
      expect(globalThis.WebSocket).to.not.equal(NativeWebSocket);
      const ws = new globalThis.WebSocket('ws://example.test/socket');
      expect(ws.url).to.eql('ws://example.test/socket');
      expect(ws.readyState).to.eql(globalThis.WebSocket.CONNECTING);

      await opened(ws);
      expect(ws.readyState).to.eql(globalThis.WebSocket.OPEN);

      const closed = closeEvent(ws);
      ws.close();
      await closed;
      expect(ws.readyState).to.eql(globalThis.WebSocket.CLOSED);
    } finally {
      mock.dispose();
    }

    expect(globalThis.WebSocket).to.equal(NativeWebSocket);
  });

  it('mock disposal is idempotent', () => {
    const NativeWebSocket = globalThis.WebSocket;
    const mock = WebFixture.WebSocket.mock();

    mock.dispose();
    mock.dispose();

    expect(globalThis.WebSocket).to.equal(NativeWebSocket);
  });
});

/**
 * Helpers:
 */
function opened(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => ws.addEventListener('open', () => resolve(), { once: true }));
}

function closeEvent(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => ws.addEventListener('close', () => resolve(), { once: true }));
}
