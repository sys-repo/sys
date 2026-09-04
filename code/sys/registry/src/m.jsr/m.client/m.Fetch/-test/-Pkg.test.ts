import { describe, expect, it } from '../../../-test.ts';
import { Jsr } from '../../m.Jsr/mod.ts';

describe('Jsr.Fetch.Pkg', () => {
  describe('Pkg.info( name, version )', () => {
    it('prefers moduleGraph2 when both graph payloads are present', async () => {
      const restore = mock.fetch((input, init) => {
        expect(String(input)).to.eql('https://jsr.io/@sys/fs/0.0.3_meta.json');
        expect(init?.cache).to.eql(undefined);
        expect([...new Headers(init?.headers)]).to.eql([]);
        return Promise.resolve(
          json({
            manifest: { '/mod.ts': { size: 10, checksum: 'sha256-demo' } },
            exports: { '.': './mod.ts' },
            moduleGraph1: {
              '/mod.ts': {
                'jsr:@sys/old@^0.0.1': {},
              },
            },
            moduleGraph2: {
              '/mod.ts': {
                dependencies: [
                  { type: 'static', specifier: 'jsr:@sys/std@^0.0.3', kind: 'import' },
                  { type: 'static', specifier: './local.ts', kind: 'importType' },
                ],
              },
            },
          }),
        );
      });

      try {
        const res = await Jsr.Fetch.Pkg.info('@sys/fs', '0.0.3');
        expect(res.ok).to.eql(true);
        expect(res.data).to.eql({
          pkg: { name: '@sys/fs', version: '0.0.3' },
          manifest: { '/mod.ts': { size: 10, checksum: 'sha256-demo' } },
          exports: { '.': './mod.ts' },
          graph: {
            format: 2,
            modules: [
              {
                path: '/mod.ts',
                dependencies: [
                  { specifier: './local.ts', kind: 'importType' },
                  { specifier: 'jsr:@sys/std@^0.0.3', kind: 'import' },
                ],
              },
            ],
          },
        });
      } finally {
        restore();
      }
    });

    it('requests fresh exact-version metadata when freshness is required', async () => {
      const restore = mock.fetch((input, init) => {
        expect(String(input)).to.include('https://jsr.io/@sys/fs/0.0.3_meta.json?sys-cache-bust=');
        expect(init?.cache).to.eql('reload');
        const headers = new Headers(init?.headers);
        expect(headers.get('cache-control')).to.eql('no-cache');
        expect(headers.get('pragma')).to.eql('no-cache');
        return Promise.resolve(json({ moduleGraph2: { '/mod.ts': { dependencies: [] } } }));
      });

      try {
        const res = await Jsr.Fetch.Pkg.info('@sys/fs', '0.0.3', { fresh: true });
        expect(res.ok).to.eql(true);
        expect(res.data?.pkg).to.eql({ name: '@sys/fs', version: '0.0.3' });
      } finally {
        restore();
      }
    });

    it('requests fresh latest-version metadata when no version is specified', async () => {
      const seen: { input: RequestInfo | URL; init?: RequestInit }[] = [];
      const restore = mock.fetch((input, init) => {
        seen.push({ input, init });
        const url = String(input);
        if (url.includes('/meta.json')) {
          return Promise.resolve(
            json({ scope: 'sys', name: 'fs', latest: '0.0.3', versions: { '0.0.3': {} } }),
          );
        }
        return Promise.resolve(json({ moduleGraph2: { '/mod.ts': { dependencies: [] } } }));
      });

      try {
        const res = await Jsr.Fetch.Pkg.info('@sys/fs');
        expect(res.ok).to.eql(true);
        expect(res.data?.pkg).to.eql({ name: '@sys/fs', version: '0.0.3' });
        expect(String(seen[0]?.input)).to.include(
          'https://jsr.io/@sys/fs/meta.json?sys-cache-bust=',
        );
        expect(String(seen[1]?.input)).to.include(
          'https://jsr.io/@sys/fs/0.0.3_meta.json?sys-cache-bust=',
        );
        expect(seen.map((item) => item.init?.cache)).to.eql(['reload', 'reload']);
      } finally {
        restore();
      }
    });

    it('falls back to moduleGraph1 when moduleGraph2 is absent', async () => {
      const restore = mock.fetch(() =>
        Promise.resolve(
          json({
            moduleGraph1: {
              '/mod.ts': {
                'jsr:@sys/std@^0.0.3': {},
                './local.ts': {},
              },
            },
          }),
        )
      );

      try {
        const res = await Jsr.Fetch.Pkg.info('@sys/fs', '0.0.3');
        expect(res.ok).to.eql(true);
        expect(res.data?.graph).to.eql({
          format: 1,
          modules: [
            {
              path: '/mod.ts',
              dependencies: [
                { specifier: './local.ts' },
                { specifier: 'jsr:@sys/std@^0.0.3' },
              ],
            },
          ],
        });
      } finally {
        restore();
      }
    });
  });
});

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

const mock = {
  fetch(fn: typeof globalThis.fetch) {
    const original = globalThis.fetch;
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fn,
    });
    return () =>
      Object.defineProperty(globalThis, 'fetch', { configurable: true, value: original });
  },
} as const;
