import { describe, expect, it } from '../../../-test.ts';
import { WebSocket as WebSocketFixture } from '../mod.ts';
import { closeEvent, opened } from './u.fixture.ts';

describe('WebFixture.WebSocket.mock', () => {
  it('replacement → drives a WebSocket lifecycle until disposed', async () => {
    const NativeWebSocket = globalThis.WebSocket;
    const mock = WebSocketFixture.mock();

    try {
      expect(globalThis.WebSocket).to.not.equal(NativeWebSocket);
      const ws = new globalThis.WebSocket('ws://example.test/socket');
      expect(ws.url).to.eql('ws://example.test/socket');
      expect(ws.readyState).to.eql(globalThis.WebSocket.CONNECTING);

      await opened(ws);
      expect(ws.readyState).to.eql(globalThis.WebSocket.OPEN);
      expect(ws.send('ignored')).to.eql(undefined);
      expect('onmessage' in ws).to.eql(false);

      const closed = closeEvent(ws);
      ws.close();
      await closed;
      expect(ws.readyState).to.eql(globalThis.WebSocket.CLOSED);
    } finally {
      mock.dispose();
    }

    expect(globalThis.WebSocket).to.equal(NativeWebSocket);
  });

  it('close while connecting → closes without opening', async () => {
    const mock = WebSocketFixture.mock();

    try {
      const ws = new globalThis.WebSocket('ws://example.test/socket');
      const events: string[] = [];
      ws.addEventListener('open', () => events.push('open'));
      ws.addEventListener('close', () => events.push('close'));
      const closed = closeEvent(ws);

      ws.close();
      expect(ws.readyState).to.eql(globalThis.WebSocket.CLOSING);
      await closed;

      expect(ws.readyState).to.eql(globalThis.WebSocket.CLOSED);
      expect(events).to.eql(['close']);
    } finally {
      mock.dispose();
    }
  });

  it('disposal → is idempotent', () => {
    const NativeWebSocket = globalThis.WebSocket;
    const mock = WebSocketFixture.mock();

    mock.dispose();
    mock.dispose();

    expect(globalThis.WebSocket).to.equal(NativeWebSocket);
  });
});
