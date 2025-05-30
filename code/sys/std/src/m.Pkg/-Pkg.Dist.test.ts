import { type t, describe, expect, it } from '../-test.ts';
import { slug } from '../m.Random/mod.ts';
import { Testing } from '../m.Testing.Server/mod.ts';
import { Dist, Pkg } from './mod.ts';

describe('Pkg.Dist', () => {
  it('API', () => {
    expect(Pkg.Dist).to.equal(Dist);
  });

  describe('Dist.fetch', () => {
    const SAMPLE = {
      dist(): t.DistPkg {
        return {
          type: 'https://jsr.io/@sample/foo',
          pkg: { name: `@ns/foo-${slug()}`, version: '1.2.3' },
          build: {
            time: 1746520471244,
            size: { total: 1234, pkg: 1234 },
            builder: '@scope/sample@0.0.0',
            runtime: '<runtime-uri>',
          },
          entry: './main.js',
          url: { base: '/' },
          hash: {
            digest: 'sha256-0000',
            parts: { './index.html': 'sha256-0000', './-entry.js': 'sha256-0000' },
          },
        };
      },
    };

    const testSetup = () => {
      const dist = SAMPLE.dist();
      const server = Testing.Http.server((req) => {
        const url = new URL(req.url);
        if (url.pathname === '/dist.json') return Testing.Http.json(dist);
        return new Response('Not found', { status: 404 });
      });
      const origin = server.url.base;
      return { server, dist, origin };
    };

    it('200: fetches ./dist.json', async () => {
      const { server, origin, dist } = testSetup();
      const res = await Pkg.Dist.fetch({ origin });
      await server.dispose();

      expect(res.ok).to.eql(true);
      expect(res.status).to.eql(200);
      expect(res.dist).to.eql(dist);
      expect(res.error).to.eql(undefined);
    });

    it('404: not found', async () => {
      const { server, origin } = testSetup();
      const res = await Pkg.Dist.fetch({ origin, pathname: 'foo.json' });
      await server.dispose();

      expect(res.ok).to.eql(false);
      expect(res.status).to.eql(404);
      expect(res.dist).to.eql(undefined);
      expect(res.error?.message).to.include('Failed while loading');
      expect(res.error?.message).to.include('/foo.json');
    });
  });

  describe('Dist.Is', () => {
    it('Is.codePath: true', () => {
      const test = (path: string, expected: boolean) => {
        expect(Pkg.Dist.Is.codePath(path)).to.eql(expected);
      };

      test('pkg', false);
      test('pkg/', true);
      test('/pkg/', true);
      test('/pkg/foo', true);
      test('/pkg/foo/pkg/bar', true);
      test('/pkg/bar', true);

      test('', false);
      test('foo', false);

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => test(value, false));
    });
  });
});
