import { describe, expect, it } from '../../../-test.ts';
import { Jsr } from '../../m.Jsr/mod.ts';

describe('Jsr.Fetch.Pkg', () => {
  describe('Pkg.info( name, version )', () => {
    it('prefers moduleGraph2 when both graph payloads are present', async () => {
      const restore = mock.fetch(async (input, init) => {
        expect(String(input)).to.eql('https://jsr.io/@sys/fs/0.0.3_meta.json');
        expect(init?.cache).to.eql('no-store');
        return json({
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
        });
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

    it('falls back to moduleGraph1 when moduleGraph2 is absent', async () => {
      const restore = mock.fetch(async () =>
        json({
          moduleGraph1: {
            '/mod.ts': {
              'jsr:@sys/std@^0.0.3': {},
              './local.ts': {},
            },
          },
        })
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
    return () => Object.defineProperty(globalThis, 'fetch', { configurable: true, value: original });
  },
} as const;
