import { c, describe, expect, it, pkg, Pkg } from '../-test.ts';
import { Server } from '../m.Server/mod.ts';
import { probeSyncServer } from './mod.ts';

describe('Crdt: SyncServer - client tools', () => {
  it('API', async () => {
    // Import address:
    const m = await import('@sys/driver-automerge/ws/client');
    expect(m.probeSyncServer).to.equal(probeSyncServer);
  });

  describe('probeSyncServer', () => {
    it('probe → returns headers + no errors', async () => {
      const ws = await Server.ws({ silent: true });
      const url = `ws://127.0.0.1:${ws.addr.port}`;

      try {
        const res = await probeSyncServer(url);

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
      const res = await probeSyncServer(url, { timeout: 200 });

      expect(res.url).to.eql(url);
      expect(res.headers).to.eql({});
      expect(res.errors.length).to.eql(1);
      expect(res.errors[0].message).to.eql(`websocket/open`);
      expect(res.errors[0].cause?.message).to.include(`connect ECONNREFUSED ${trimPrefix(url)}`);
      expect(res.pkg).to.eql(Pkg.unknown());
    });

    it('invalid URL → resolves with errors, not throw', async () => {
      const url = 'not a url';
      const res = await probeSyncServer(url, { timeout: 200 });
      expect(res.elapsed).to.be.greaterThanOrEqual(0);
      expect(res.errors.length).to.eql(1);
      expect(res.headers).to.eql({});

      expect(res.errors[0].message).to.eql(`url/invalid: ${url}`);
      expect(res.errors[0].cause?.message).to.eql(`Invalid URL: 'not a url'`);
    });

    const trimPrefix = (url: string) => url.replace(/ws\:\/\//, '');

    it('no server on high port → resolves with errors', async () => {
      const url = 'ws://127.0.0.1:65500';
      const res = await probeSyncServer(url, { timeout: 300 });
      expect(res.headers).to.eql({});
      expect(res.errors.length).to.eql(1);
      expect(res.errors[0].message).to.eql(`websocket/open`);
      expect(res.errors[0].cause?.message).to.include(`connect ECONNREFUSED ${trimPrefix(url)}`);
    });
  });
});
