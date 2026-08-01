import { describe, expect, it } from '../../../-test.ts';
import { Npm } from '../../mod.ts';

describe('Npm.Fetch.Pkg', () => {
  describe('Pkg.versions( name )', () => {
    it('uses no-store cache for package metadata', async () => {
      const restore = mock.fetch((_input, init) => {
        expect(init?.cache).to.eql('no-store');
        return Promise.resolve(
          json({
            name: 'react',
            'dist-tags': { latest: '19.0.0' },
            versions: { '19.0.0': {} },
            time: { '19.0.0': '2026-06-01T18:00:48.323Z' },
          }),
        );
      });

      try {
        const res = await Npm.Fetch.Pkg.versions('react');
        expect(res.ok).to.eql(true);
        expect(res.ok ? res.finalUrl : res.url).to.eql('https://registry.npmjs.org/react');
        expect(res.data?.name).to.eql('react');
        expect(res.data?.latest).to.eql('19.0.0');
        expect(res.data?.versions).to.eql({
          '19.0.0': { publishedAt: '2026-06-01T18:00:48.323Z' },
        });
      } finally {
        restore();
      }
    });

    it('maps top-level metadata into canonical version data', async () => {
      const restore = mock.fetch(() =>
        Promise.resolve(
          json({
            name: '@scope/foo',
            'dist-tags': { latest: '1.2.3' },
            versions: {
              '1.2.2': {},
              '1.2.3': { deprecated: 'use 2.0.0' },
            },
            time: {
              created: '2026-05-01T00:00:00.000Z',
              modified: '2026-06-01T00:00:00.000Z',
              '1.2.2': '2026-05-15T12:00:00.000Z',
              '1.2.3': '2026-06-01T12:00:00.000Z',
            },
          }),
        )
      );

      try {
        const res = await Npm.Fetch.Pkg.versions('@scope/foo');
        expect(res.ok).to.eql(true);
        expect(res.data).to.eql({
          name: '@scope/foo',
          latest: '1.2.3',
          versions: {
            '1.2.2': { publishedAt: '2026-05-15T12:00:00.000Z' },
            '1.2.3': {
              deprecated: 'use 2.0.0',
              publishedAt: '2026-06-01T12:00:00.000Z',
            },
          },
        });
      } finally {
        restore();
      }
    });
  });

  describe('Pkg.info( name, version )', () => {
    it('fetches a specific package version', async () => {
      const restore = mock.fetch((input, init) => {
        expect(String(input)).to.eql('https://registry.npmjs.org/react/19.0.0');
        expect(init?.cache).to.eql('no-store');
        return Promise.resolve(
          json({
            name: 'react',
            version: '19.0.0',
            dist: {
              tarball: 'https://registry.npmjs.org/react/-/react-19.0.0.tgz',
              integrity: 'sha512-demo',
              shasum: 'deadbeef',
            },
            dependencies: { scheduler: '^1.0.0' },
            devDependencies: { typescript: '^5.0.0' },
            exports: { '.': './index.js' },
          }),
        );
      });

      try {
        const res = await Npm.Fetch.Pkg.info('react', '19.0.0');
        expect(res.ok).to.eql(true);
        expect(res.data).to.eql({
          pkg: { name: 'react', version: '19.0.0' },
          dist: {
            tarball: 'https://registry.npmjs.org/react/-/react-19.0.0.tgz',
            integrity: 'sha512-demo',
            shasum: 'deadbeef',
          },
          dependencies: { scheduler: '^1.0.0' },
          devDependencies: { typescript: '^5.0.0' },
          exports: { '.': './index.js' },
        });
      } finally {
        restore();
      }
    });

    it('uses latest version when omitted', async () => {
      const seen: string[] = [];
      const restore = mock.fetch((input) => {
        seen.push(String(input));
        if (seen.length === 1) {
          return Promise.resolve(
            json({
              name: 'react',
              'dist-tags': { latest: '19.1.0' },
              versions: { '19.1.0': {} },
            }),
          );
        }
        return Promise.resolve(
          json({
            name: 'react',
            version: '19.1.0',
            dist: { tarball: 'https://registry.npmjs.org/react/-/react-19.1.0.tgz' },
          }),
        );
      });

      try {
        const res = await Npm.Fetch.Pkg.info('react');
        expect(res.ok).to.eql(true);
        expect(seen).to.eql([
          'https://registry.npmjs.org/react',
          'https://registry.npmjs.org/react/19.1.0',
        ]);
        expect(res.data?.pkg).to.eql({ name: 'react', version: '19.1.0' });
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
