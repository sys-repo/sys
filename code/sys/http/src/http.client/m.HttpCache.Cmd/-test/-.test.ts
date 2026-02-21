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
      expect(CacheCmd.INFO).to.eql('http.cache.info');
      expect(typeof CacheCmd.Handlers.all).to.eql('function');
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
        'http.cache.info': (e) => {
          const entries = e.scope === 'all' ? 5 : 2;
          return {
            ok: true,
            at: 456 as t.Msecs,
            scope: e.scope ?? 'pkg',
            totals: { caches: 2, entries },
            caches: [
              { name: 'my-pkg:asset-files', kind: 'asset', entries: 1 },
              { name: 'my-pkg:media-files', kind: 'media', entries: entries - 1 },
            ],
          };
        },
      });

      const client = cmd.client(port2);
      const result = await client.send(CacheCmd.CLEAR, { scope: 'pkg' });

      expect(result.ok).to.eql(true);
      expect(result.deleted).to.eql(['a', 'b']);
      expect(result.total).to.eql(2);
      expect(result.at).to.eql(123);

      const info = await client.send(CacheCmd.INFO, { scope: 'all' });
      expect(info.ok).to.eql(true);
      expect(info.scope).to.eql('all');
      expect(info.totals.entries).to.eql(5);
      expect(info.caches.length).to.eql(2);

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
          return (
            name.endsWith(':asset-files') ||
            name.endsWith(':media-files') ||
            name.endsWith(':media-range-files')
          );
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

        expect(deleted).to.eql([
          'my-pkg:asset-files',
          'my-pkg:media-files',
          'my-pkg:media-range-files',
        ]);
        expect(result.deleted).to.eql([
          'my-pkg:asset-files',
          'my-pkg:media-files',
          'my-pkg:media-range-files',
        ]);
        expect(result.total).to.eql(3);
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

  describe('Handlers.info', () => {
    it('reports pkg scoped cache keys by default', async () => {
      const original = Object.getOwnPropertyDescriptor(globalThis, 'caches');
      const index = {
        'my-pkg:asset-files': ['a1', 'a2'],
        'my-pkg:media-files': ['m1'],
        'my-pkg:media-range-files': ['r1', 'r2', '__sys_http_media_range_meta__'],
        'other:cache': ['o1', 'o2', 'o3'],
      } as const;
      const mock = {
        keys: async () => Object.keys(index),
        open: async (name: string) => {
          if (name === 'my-pkg:media-range-files') {
            return {
              keys: async () =>
                index['my-pkg:media-range-files'].map(
                  (key) => new Request(`https://example.com/${key}`),
                ),
              match: async (key: string) => {
                if (key !== '__sys_http_media_range_meta__') return undefined;
                return new Response(
                  JSON.stringify({
                    entries: {
                      'https://cdn/r1': { bytes: 11 },
                      'https://cdn/r2': { bytes: 22 },
                    },
                  }),
                  { status: 200, headers: { 'content-type': 'application/json' } },
                );
              },
            };
          }
          const values = index[name as keyof typeof index] ?? [];
          return {
            keys: async () => values.map((key) => new Request(`https://example.com/${key}`)),
            match: async (_key: string) => undefined,
          };
        },
        delete: async (_name: string) => true,
      };
      Object.defineProperty(globalThis, 'caches', {
        value: mock,
        configurable: true,
        writable: true,
      });

      try {
        const info = CacheCmd.Handlers.info({ pkg: { name: 'my-pkg', version: '1.0.0' } });
        const result = await info({});

        expect(result.ok).to.eql(true);
        expect(result.scope).to.eql('pkg');
        expect(result.totals.caches).to.eql(3);
        expect(result.totals.entries).to.eql(5);
        expect(result.totals.bytes).to.eql(33);
        expect(result.diagnostics?.mediaRange).to.eql({
          caches: 1,
          entries: 2,
          bytes: 33,
          metaEntries: 2,
        });
        expect(result.caches).to.eql([
          { name: 'my-pkg:asset-files', kind: 'asset', entries: 2 },
          { name: 'my-pkg:media-files', kind: 'media', entries: 1 },
          {
            name: 'my-pkg:media-range-files',
            kind: 'media-range',
            entries: 2,
            bytes: 33,
            metaEntries: 2,
          },
        ]);
      } finally {
        if (original) Object.defineProperty(globalThis, 'caches', original);
      }
    });

    it('reports all cache keys when scope is "all"', async () => {
      const original = Object.getOwnPropertyDescriptor(globalThis, 'caches');
      const index = {
        'my-pkg:asset-files': ['a1'],
        'my-pkg:media-files': ['m1'],
        'my-pkg:media-range-files': ['r1', '__sys_http_media_range_meta__'],
        'other:cache': ['o1', 'o2'],
      } as const;
      const mock = {
        keys: async () => Object.keys(index),
        open: async (name: string) => {
          if (name === 'my-pkg:media-range-files') {
            return {
              keys: async () =>
                index['my-pkg:media-range-files'].map(
                  (key) => new Request(`https://example.com/${key}`),
                ),
              match: async (key: string) => {
                if (key !== '__sys_http_media_range_meta__') return undefined;
                return new Response(
                  JSON.stringify({
                    entries: {
                      'https://cdn/r1': { bytes: 10 },
                    },
                  }),
                  { status: 200, headers: { 'content-type': 'application/json' } },
                );
              },
            };
          }
          const values = index[name as keyof typeof index] ?? [];
          return {
            keys: async () => values.map((key) => new Request(`https://example.com/${key}`)),
            match: async (_key: string) => undefined,
          };
        },
        delete: async (_name: string) => true,
      };
      Object.defineProperty(globalThis, 'caches', {
        value: mock,
        configurable: true,
        writable: true,
      });

      try {
        const info = CacheCmd.Handlers.info({ pkg: { name: 'my-pkg', version: '1.0.0' } });
        const result = await info({ scope: 'all' });

        expect(result.ok).to.eql(true);
        expect(result.scope).to.eql('all');
        expect(result.totals.caches).to.eql(4);
        expect(result.totals.entries).to.eql(5);
        expect(result.totals.bytes).to.eql(10);
        expect(result.caches).to.eql([
          { name: 'my-pkg:asset-files', kind: 'asset', entries: 1 },
          { name: 'my-pkg:media-files', kind: 'media', entries: 1 },
          {
            name: 'my-pkg:media-range-files',
            kind: 'media-range',
            entries: 1,
            bytes: 10,
            metaEntries: 1,
          },
          { name: 'other:cache', kind: 'other', entries: 2 },
        ]);
      } finally {
        if (original) Object.defineProperty(globalThis, 'caches', original);
      }
    });
  });

  describe('Handlers.all', () => {
    it('returns clear and info handlers', () => {
      const handlers = CacheCmd.Handlers.all({ pkg: { name: 'my-pkg', version: '1.0.0' } });
      expect(typeof handlers.clear).to.eql('function');
      expect(typeof handlers.info).to.eql('function');
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
        info: ({ scope }) => {
          return {
            ok: true,
            at: Date.now(),
            scope: scope ?? 'pkg',
            totals: { caches: 1, entries: 1 },
            caches: [{ name: 'my-pkg:asset-files', kind: 'asset', entries: 1 }],
          };
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

      const info = await client.send(CacheCmd.INFO, { scope: 'pkg' });
      expect(info.ok).to.eql(true);
      expect(info.scope).to.eql('pkg');
      expect(info.totals.caches).to.eql(1);

      client.dispose();
      life.dispose();
      target.close();
      sender.close();
      clientEndpoint.close();
    });
  });
});
