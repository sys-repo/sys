import { slug, describe, expect, it, Testing } from '../-test.ts';
import { Server } from './mod.ts';
import { Fs, Time } from './common.ts';

describe('Crdt: Server', { sanitizeResources: false, sanitizeOps: false }, () => {
  const silent = true;

  it('API', async () => {
    const m = await import('@sys/driver-automerge/server');
    expect(m.Server).to.equal(Server);
  });

  describe('start', () => {
    it('start', async () => {
      const dir = `.tmp/test/${slug()}.crdt`;
      const port = Testing.randomPort();
      const ws = await Server.ws({ dir, port });

      expect(ws.repo.id.peer.startsWith('crdt-peer-')).to.be.true;
      expect(ws.port).to.eql(port);

      await Time.wait(50);
      expect(await Fs.exists(dir)).to.eql(true);

      await ws.dispose();
    });

    it('start: no port → generates random port', async () => {
      const ws = await Server.ws({ silent });
      expect(ws.port).to.be.a('number');
      await ws.dispose();
    });
  });

  describe('dispose (async)', () => {
    it('dispose method', async () => {
      const ws = await Server.ws({ silent });
      const port = ws.port;
      expect(ws.disposed).to.eql(false);
      expect(ws.repo.disposed).to.eql(false);

      // NB: port is reachable prior to disposal.
      await Time.wait(30);
      expect((await Testing.connect(port)).refused).to.eql(false);

      await ws.dispose();
      expect(ws.disposed).to.eql(true);
      expect(ws.repo.disposed).to.eql(true);

      // NB: port is now unreachable - server has shutdown.
      expect((await Testing.connect(port)).refused).to.eql(true);
    });
  });
});
