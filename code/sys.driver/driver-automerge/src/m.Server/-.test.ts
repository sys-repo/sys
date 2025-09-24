import { c, describe, expect, it, Pkg, pkg, slug, Testing } from '../-test.ts';
import { Fs, rx, Time } from './common.ts';
import { Server } from './mod.ts';
import { probe } from './u.probe.ts';

describe('Crdt: SyncServer', { sanitizeResources: false, sanitizeOps: false }, () => {
  const silent = true;

  it('API', async () => {
    // Import address:
    const ws = await import('@sys/driver-automerge/ws');
    expect(ws.Server).to.equal(Server);
    expect(ws.Server.probe).to.equal(probe);
  });

  describe('Server.ws: start', () => {
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

  describe('Server.ws: dispose (async)', () => {
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

  describe('Server.ws: headers', () => {
    it('adds "sys-module" HTTP header onto the WebSocket handshake', async () => {
      const ws = await Server.ws({ silent: true });
      const port = ws.addr.port;

      const url = `ws://127.0.0.1:${port}`;
      const res = await Server.probe(url);
      const headers = res.headers;

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
        await ws.dispose();
      }
    });
  });

  describe('Server.probe', () => {
    it('probe → returns headers + no errors', async () => {
      const ws = await Server.ws({ silent: true });
      const url = `ws://127.0.0.1:${ws.addr.port}`;

      try {
        const res = await Server.probe(url);

        console.info();
        console.info(c.brightCyan('T:ProbeResult'));
        console.info(c.gray(`${url} → { ${c.green('response-headers')} }`));
        console.info();
        console.info(res);
        console.info();

        // Structure.
        expect(res.url).to.be.a('string');
        expect(res.elapsed).to.be.greaterThanOrEqual(0);
        expect(res.errors).to.eql([]);
        expect(res.pkg).to.eql(pkg);

        // Handshake headers (shape mirrors the working test).
        const h = res.headers;
        expect(h).to.be.an('object');

        expect(h.upgrade === 'websocket').to.eql(true);
        expect(h.connection === 'Upgrade').to.eql(true);
        expect(h.date).to.be.a('string');

        // Scoped pkg string like "@scope/name@version".
        expect(h['sys-module']).to.be.a('string');
        expect(/^@[^/]+\/[^@]+@[^@/]+$/.test(h['sys-module'])).to.eql(true);

        // RFC6455 accept header checks (base64, 20-byte SHA-1).
        const accept = h['sec-websocket-accept'];
        expect(accept).to.be.a('string');
        expect(/^[A-Za-z0-9+/]+={0,2}$/.test(accept)).to.eql(true);
        const raw = atob(accept);
        expect(raw.length).to.eql(20);
      } finally {
        await ws.dispose();
      }
    });

    it('timeout → resolves with errors, not throw', async () => {
      // Choose an address unlikely to be listening; keep timeout tight.
      const url = 'ws://127.0.0.1:9';
      const res = await Server.probe(url, { timeout: 200 });

      expect(res.url).to.eql(url);
      expect(res.headers).to.eql({});
      expect(res.errors.length).to.eql(1);
      expect(res.errors[0].message).to.eql(`websocket/open`);
      expect(res.errors[0].cause?.message).to.include(`connect ECONNREFUSED ${trimPrefix(url)}`);
      expect(res.pkg).to.eql(Pkg.unknown());
    });

    it('invalid URL → resolves with errors, not throw', async () => {
      const url = 'not a url';
      const res = await Server.probe(url, { timeout: 200 });
      expect(res.elapsed).to.be.greaterThanOrEqual(0);
      expect(res.errors.length).to.eql(1);
      expect(res.headers).to.eql({});

      expect(res.errors[0].message).to.eql(`url/invalid: ${url}`);
      expect(res.errors[0].cause?.message).to.eql(`Invalid URL: 'not a url'`);
    });

    const trimPrefix = (url: string) => url.replace(/ws\:\/\//, '');

    it('no server on high port → resolves with errors', async () => {
      const url = 'ws://127.0.0.1:65500';
      const res = await Server.probe(url, { timeout: 300 });
      expect(res.headers).to.eql({});
      expect(res.errors.length).to.eql(1);
      expect(res.errors[0].message).to.eql(`websocket/open`);
      expect(res.errors[0].cause?.message).to.include(`connect ECONNREFUSED ${trimPrefix(url)}`);
    });
  });
});
