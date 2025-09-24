import { Net } from '@sys/http';
import { c, describe, expect, it, pkg } from '../-test.ts';
import { Server } from '../m.Server/mod.ts';
import { ServerInfo } from './mod.ts';

describe('Crdt: SyncServer - client tools', () => {
  it('API', async () => {
    const m = await import('@sys/driver-automerge/ws/client');
    expect(m.ServerInfo).to.equal(ServerInfo);
  });

  describe('ServerInfo.get', () => {
    it('success: meta-data', async () => {
      const ws = await Server.ws({ silent: true });
      try {
        const url = Net.toUrl(ws.addr, 'http');
        const res = await ServerInfo.get(url);

        expect(res.url).to.eql(url);
        expect(res.data.pkg).to.eql(pkg);
        expect(res.data.total.peers).to.eql(0);
        expect(res.errors).to.eql([]);
        expect(res.elapsed).to.be.greaterThanOrEqual(0);

        console.info();
        console.info(c.cyan('ServerInfo.get (success)'));
        console.info(c.gray(url));
        console.info(res);
        console.info();
      } finally {
        await ws.dispose();
      }
    });

    it('error: unreachable host/port', async () => {
      const url = Net.toUrl({ hostname: '127.0.0.1', port: 65535, transport: 'tcp' }, 'http');
      const res = await ServerInfo.get(url);

      expect(res.url).to.eql(url);
      // Stays unknown on failure:
      expect(res.data.pkg.name).to.eql('<unknown>');
      expect(res.data.pkg.version).to.eql('0.0.0');
      expect(res.errors.length).to.be.greaterThan(0);
      expect(res.elapsed).to.be.greaterThanOrEqual(0);
    });

    it('error: non-JSON / 404 path on a running server', async () => {
      const ws = await Server.ws({ silent: true });
      try {
        const bad = `${Net.toUrl(ws.addr, 'http')}/not-found-path`;
        const res = await ServerInfo.get(bad);

        expect(res.url).to.eql(bad);
        // unchanged (unknown) on bad response:
        expect(res.data.pkg.name).to.eql('<unknown>');
        expect(res.data.pkg.version).to.eql('0.0.0');
        expect(res.errors.length).to.be.greaterThan(0);
        expect(res.elapsed).to.be.greaterThanOrEqual(0);
      } finally {
        await ws.dispose();
      }
    });
  });
});
