import WS from 'ws';
import { type t, c, describe, expect, it, Pkg, pkg, slug, Testing } from '../-test.ts';
import { Fs, rx, Time } from './common.ts';
import { Server } from './mod.ts';

describe('Crdt: Server', { sanitizeResources: false, sanitizeOps: false }, () => {
  const silent = true;

  it('API', async () => {
    // Import address:
    const ws = await import('@sys/driver-automerge/ws');
    expect(ws.Server).to.equal(Server);
  });

  describe('start', () => {
    it('start', async () => {
      const dir = `.tmp/test/${slug()}.crdt`;
      const port = Testing.randomPort();
      const ws = await Server.ws({ dir, port });

      expect(ws.repo.id.peer.startsWith('crdt-peer-')).to.be.true;
      expect(ws.addr.port).to.eql(port);
      expect(await Fs.exists(dir)).to.eql(true);

      await ws.dispose();
    });

    it('start: no port → generates random port', async () => {
      const ws = await Server.ws({ silent });
      expect(ws.addr.port).to.be.a('number');
      await ws.dispose();
    });
  });

  describe('dispose (async)', () => {
    it('dispose method', async () => {
      const ws = await Server.ws({ silent });
      const port = ws.addr.port;
      expect(ws.disposed).to.eql(false);
      expect(ws.repo.disposed).to.eql(false);

      // NB: port is reachable prior to disposal.
      expect((await Testing.connect(port)).refused).to.eql(false);

      await ws.dispose();
      expect(ws.disposed).to.eql(true);
      expect(ws.repo.disposed).to.eql(true);

      // NB: port is now unreachable - server has shutdown.
      expect((await Testing.connect(port)).refused).to.eql(true);
    });

    it('dispose$ param', async () => {
      const life = rx.disposable();
      const ws = await Server.ws({ silent, dispose$: life });
      const port = ws.addr.port;
      expect(ws.disposed).to.eql(false);
      expect(ws.repo.disposed).to.eql(false);
      expect((await Testing.connect(port)).refused).to.eql(false);

      life.dispose();
      await Time.wait(100);

      expect((await Testing.connect(port)).refused).to.eql(true); // NB: port is now unreachable - server has shutdown.
    });
  });

  describe('headers', () => {
    it('adds "sys-module" HTTP header onto the WebSocket handshake', async () => {
      const wsServer = await Server.ws({ silent: true });
      const port = wsServer.addr.port;

      // Use the ws client so we can read the 101 response headers via the "upgrade" event.
      const url = `ws://127.0.0.1:${port}`;
      const client = new WS(url);

      let headers: t.SyncServerResponseHeaders | undefined;
      const opened = new Promise<void>((resolve, reject) => {
        client.once('upgrade', (res: any) => (headers = res?.headers ?? {}));
        client.once('open', () => resolve());
        client.once('error', reject);
      });

      await opened;

      console.info();
      console.info(c.brightCyan('T:SyncServerResponseHeaders'));
      console.info(c.gray(`${url} → { ${c.green('response-headers')} }`));
      console.info();
      console.info(headers);
      console.info();

      try {
        expect(headers).to.be.an('object');

        expect(headers?.upgrade === 'websocket').to.be.true;
        expect(headers?.connection === 'Upgrade').to.be.true;
        expect(headers?.date).to.be.a.string;
        expect(headers?.['sys-module']).to.eql(Pkg.toString(pkg));

        // Accept handshake: "sec-websocket-accept".
        {
          const accept = headers?.['sec-websocket-accept'] as string;
          expect(accept).to.be.a('string');

          // Looks like standard base64 (no URL-safe chars), optional "=" padding:
          expect(/^[A-Za-z0-9+/]+={0,2}$/.test(accept)).to.eql(true);

          // Decodes to 20 bytes (SHA-1 output length) per the RFC 6455 handshake:
          const raw = atob(accept as string);
          expect(raw.length).to.eql(20);
        }
      } finally {
        client.close();
        await wsServer.dispose();
      }
    });
  });
});
