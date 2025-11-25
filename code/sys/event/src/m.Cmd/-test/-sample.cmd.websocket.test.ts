import { Net } from '@sys/http/server';
import { describe, expect, it, type t } from '../../-test.ts';
import { Cmd } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

import { fromWebSocket } from '../transport/mod.ts';

describe('Cmd over WebSocket', () => {
  describe('vanilla WebSocket networking baselin', () => {
    it('ping/pong roundtrip over localhost WebSocket', async () => {
      const port = Net.port();
      const ac = new AbortController();

      // Server: upgrade to WebSocket and echo "ping" → "pong", then close.
      Deno.serve({ hostname: '127.0.0.1', port, signal: ac.signal }, (req) => {
        const { socket, response } = Deno.upgradeWebSocket(req);
        const serverPort = Fixture.portFromWebSocket(socket);

        serverPort.addEventListener('message', (event) => {
          const msg = event.data as { id: string; type: 'ping' | 'pong' };
          if (msg.type === 'ping') {
            serverPort.postMessage({ id: msg.id, type: 'pong' });
            serverPort.close?.(); // close server side once we’re done
          }
        });

        return response;
      });

      // Client: connect, send "ping", await "pong".
      const ws = new WebSocket(`ws://127.0.0.1:${port}`);
      const closed = new Promise<void>((resolve) => {
        // Track close so we can wait for it (avoids leak warnings).
        ws.onclose = () => resolve();
      });

      await Fixture.waitForOpen(ws);

      const clientPort = Fixture.portFromWebSocket(ws);
      const id = '1';

      const result = await new Promise<{ id: string; type: string }>((resolve) => {
        clientPort.addEventListener('message', (event) => {
          const msg = event.data as { id: string; type: string };
          if (msg.id === id) resolve(msg);
        });

        clientPort.postMessage({ id, type: 'ping' });
      });

      expect(result.type).to.equal('pong');

      // Close client side and wait for both ends to tear down.
      clientPort.close?.();
      await closed;

      // Now stop the HTTP server.
      ac.abort();
    });
  });

  describe('Cmd → WebSocket (host/client)', () => {
    it('roundtrip', async () => {
      /**
       * Sequence:
       * 1. Setup dynamic port (Net.port()).
       * 2. Start Deno.serve() with WebSocket upgrade.
       * 3. Inside upgrade handler → adapt the WebSocket with fromWebSocket() and create Cmd.host.
       * 4. Connect client WebSocket.
       * 5. Adapt client WebSocket with fromWebSocket() and create Cmd.client.
       * 6. Send one or more commands.
       * 7. Assert results.
       * 8. Close client & server sockets.
       * 9. Abort server.
       * 10. Await all closure promises.
       */
      type CmdName = 'ping';
      type CmdPayload = { ping: { count: number } };
      type CmdResult = { ping: { count: number; ok: boolean } };

      const port = Net.port();
      const ac = new AbortController();
      const cmd = Cmd.make<CmdName, CmdPayload, CmdResult>();

      let serverEndpoint: t.CmdEndpoint | undefined;

      Deno.serve({ hostname: '127.0.0.1', port, signal: ac.signal }, (req) => {
        const { socket, response } = Deno.upgradeWebSocket(req);
        const endpoint = fromWebSocket(socket);
        serverEndpoint = endpoint;

        const host = cmd.host(endpoint, { ping: (e) => ({ ok: true, count: e.count + 1 }) });
        socket.onclose = () => host.dispose();

        return response;
      });

      const ws = new WebSocket(`ws://127.0.0.1:${port}`);
      const clientClosed = new Promise<void>((resolve) => (ws.onclose = () => resolve()));
      await Fixture.waitForOpen(ws);

      const clientEndpoint = fromWebSocket(ws);
      const client = cmd.client(clientEndpoint);

      const result = await client.send('ping', { count: 41 });

      expect(result.ok).to.equal(true);
      expect(result.count).to.equal(42);

      // Cleanup:
      client.dispose();
      clientEndpoint.close?.();
      serverEndpoint?.close?.();
      await clientClosed;
      ac.abort();
    });
  });
});
