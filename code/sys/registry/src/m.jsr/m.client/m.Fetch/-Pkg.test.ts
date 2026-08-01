import { describe, expect, it } from '../../-test.ts';
import { Jsr } from '../m.Jsr/mod.ts';

describe('Jsr.Fetch.Pkg', () => {
  describe('Pkg.versions( name )', () => {
    it('requests fresh package metadata by default', async () => {
      const original = globalThis.fetch;
      let captured: RequestInit | undefined;

      Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        value: (input: RequestInfo | URL, init?: RequestInit) => {
          expect(String(input)).to.include('https://jsr.io/@sys/std/meta.json?sys-cache-bust=');
          captured = init;
          const res = JSON.stringify({
            scope: 'sys',
            name: 'std',
            latest: '1.0.0',
            versions: { '1.0.0': { createdAt: '2026-07-05T01:17:43.938610Z' } },
          });
          return Promise.resolve(
            new Response(res, {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }),
          );
        },
      });

      try {
        const res = await Jsr.Fetch.Pkg.versions('@sys/std');
        expect(res.ok).to.eql(true);
        expect(res.data?.versions['1.0.0']?.createdAt).to.eql('2026-07-05T01:17:43.938610Z');
        expect(captured?.cache).to.eql('reload');
        const headers = new Headers(captured?.headers);
        expect(headers.get('cache-control')).to.eql('no-cache');
        expect(headers.get('pragma')).to.eql('no-cache');
      } finally {
        Object.defineProperty(globalThis, 'fetch', { configurable: true, value: original });
      }
    });

    it('can accept cached package metadata when freshness is not required', async () => {
      const original = globalThis.fetch;
      let captured: { input: RequestInfo | URL; init?: RequestInit } | undefined;

      Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        value: (input: RequestInfo | URL, init?: RequestInit) => {
          captured = { input, init };
          const res = JSON.stringify({
            scope: 'sys',
            name: 'std',
            latest: '1.0.0',
            versions: { '1.0.0': { createdAt: '2026-07-05T01:17:43.938610Z' } },
          });
          return Promise.resolve(
            new Response(res, {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }),
          );
        },
      });

      try {
        const res = await Jsr.Fetch.Pkg.versions('@sys/std', { fresh: false });
        expect(res.ok).to.eql(true);
        expect(String(captured?.input)).to.eql('https://jsr.io/@sys/std/meta.json');
        expect(captured?.init?.cache).to.eql(undefined);
        const headers = new Headers(captured?.init?.headers);
        expect([...headers]).to.eql([]);
      } finally {
        Object.defineProperty(globalThis, 'fetch', { configurable: true, value: original });
      }
    });
  });
});
