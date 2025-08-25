import { describe, expect, it, slug, Testing } from '../-test.ts';
import { Fs, rx, Time } from './common.ts';
import { Server } from './mod.ts';

describe('Crdt: Server', { sanitizeResources: false, sanitizeOps: false }, () => {
  const silent = true;

  it('API', async () => {
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
});
