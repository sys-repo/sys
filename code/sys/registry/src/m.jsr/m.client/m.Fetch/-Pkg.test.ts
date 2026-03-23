import { c, describe, expect, it, Rx, Semver, slug, Testing } from '../../-test.ts';
import { Jsr } from '../m.Jsr/mod.ts';
import { assertFetchDisposed } from './-u.ts';
import { Fetch } from './mod.ts';

describe('Jsr.Fetch.Pkg', () => {
  describe('Pkg.versions( name )', () => {
    it('uses no-store cache for package metadata', async () => {
      const original = globalThis.fetch;
      let captured: RequestInit | undefined;

      Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        value: async (_input: RequestInfo | URL, init?: RequestInit) => {
          captured = init;
          const res = JSON.stringify({ scope: 'sys', name: 'std', latest: '1.0.0', versions: {} });
          return new Response(res, {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        },
      });

      try {
        const res = await Jsr.Fetch.Pkg.versions('@sys/std');
        expect(res.ok).to.eql(true);
        expect(captured?.cache).to.eql('no-store');
      } finally {
        Object.defineProperty(globalThis, 'fetch', { configurable: true, value: original });
      }
    });

  });
});
