import { type t, describe, expect, it } from '../../../-test.ts';

import { CacheCmd } from '../m.Cmd.ts';
import { Cache } from '../../m.HttpCache/mod.ts';

describe('Http.Cache.Cmd', () => {
  describe('API', () => {
    it('exports from Http.Cache namespace', () => {
      expect(Cache.Cmd).to.equal(CacheCmd);
    });

    it('constants', () => {
      expect(CacheCmd.NS).to.eql('http.cache');
      expect(CacheCmd.CONNECT).to.eql('http.cache.cmd.connect');
      expect(CacheCmd.CLEAR).to.eql('http.cache.clear');
    });
  });

  describe('make', () => {
    it('unary command algebra', async () => {
      const cmd = CacheCmd.make();
      const { port1, port2 } = new MessageChannel();

      const host = cmd.host(port1, {
        'http.cache.clear': (e) => {
          const deleted = e.scope === 'all' ? ['a', 'b', 'c'] : ['a', 'b'];
          return {
            ok: true,
            deleted,
            total: deleted.length,
            at: 123 as t.Msecs,
          };
        },
      });

      const client = cmd.client(port2);
      const result = await client.send(CacheCmd.CLEAR, { scope: 'pkg' });

      expect(result.ok).to.eql(true);
      expect(result.deleted).to.eql(['a', 'b']);
      expect(result.total).to.eql(2);
      expect(result.at).to.eql(123);

      client.dispose();
      host.dispose();
    });
  });

  describe('Handlers.clear', () => {
    it('deletes pkg scoped cache keys by default', async () => {
      const original = Object.getOwnPropertyDescriptor(globalThis, 'caches');
      const deleted: string[] = [];
      const mock = {
        keys: async () => ['ignored:1', 'ignored:2'],
        delete: async (name: string) => {
          deleted.push(name);
          return name.endsWith(':asset-files') || name.endsWith(':media-files');
        },
      };
      Object.defineProperty(globalThis, 'caches', {
        value: mock,
        configurable: true,
        writable: true,
      });

      try {
        const clear = CacheCmd.Handlers.clear({ pkg: { name: 'my-pkg', version: '1.0.0' } });
        const result = await clear({});

        expect(deleted).to.eql(['my-pkg:asset-files', 'my-pkg:media-files']);
        expect(result.deleted).to.eql(['my-pkg:asset-files', 'my-pkg:media-files']);
        expect(result.total).to.eql(2);
        expect(result.ok).to.eql(true);
      } finally {
        if (original) Object.defineProperty(globalThis, 'caches', original);
      }
    });

    it('deletes all cache keys when scope is "all"', async () => {
      const original = Object.getOwnPropertyDescriptor(globalThis, 'caches');
      const deleted: string[] = [];
      const all = ['a', 'b', 'c'];
      const mock = {
        keys: async () => all,
        delete: async (name: string) => {
          deleted.push(name);
          return name !== 'b';
        },
      };
      Object.defineProperty(globalThis, 'caches', {
        value: mock,
        configurable: true,
        writable: true,
      });

      try {
        const clear = CacheCmd.Handlers.clear({ pkg: { name: 'my-pkg', version: '1.0.0' } });
        const result = await clear({ scope: 'all' });

        expect(deleted).to.eql(all);
        expect(result.deleted).to.eql(['a', 'c']);
        expect(result.total).to.eql(2);
        expect(result.ok).to.eql(true);
      } finally {
        if (original) Object.defineProperty(globalThis, 'caches', original);
      }
    });
  });

  describe('listen', () => {
    it('hosts clear command from handshake', async () => {
      const { port1: target, port2: sender } = new MessageChannel();
      const { port1: clientEndpoint, port2: hostEndpoint } = new MessageChannel();

      const life = CacheCmd.listen({
        target,
        silent: true,
        clear: ({ scope }) => {
          const deleted = scope === 'all' ? ['x', 'y', 'z'] : ['x'];
          return { ok: true, deleted, total: deleted.length, at: Date.now() };
        },
      });

      sender.postMessage({ kind: CacheCmd.CONNECT }, [hostEndpoint]);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const client = CacheCmd.make().client(clientEndpoint);
      const result = await client.send(CacheCmd.CLEAR, { scope: 'all' });

      expect(result.ok).to.eql(true);
      expect(result.deleted).to.eql(['x', 'y', 'z']);
      expect(result.total).to.eql(3);
      expect(typeof result.at).to.eql('number');

      client.dispose();
      life.dispose();
      target.close();
      sender.close();
      clientEndpoint.close();
    });
  });
});
