import { describe, expect, it, pkg } from '../../../-test.ts';
import { Http, Pkg } from '../common.ts';
import { HttpServer } from '../mod.ts';

describe('HTTP: Server', () => {
  describe('HttpServer: create → fetch', () => {
    it('app: start → req/res → dispose', async () => {
      const app = HttpServer.create();
      const listener = Deno.serve({ port: 0 }, app.fetch);

      type T = { count: number };
      app.get('/', (c) => c.json({ count: 123 }));

      const fetch = Http.fetcher();
      const url = Http.url(listener.addr);

      const res1 = await fetch.json<T>(url.raw);
      const res2 = await fetch.json<T>(url.join('404'));

      expect(res1.status).to.eql(200);
      expect(res2.status).to.eql(404);

      expect(res1.data).to.eql({ count: 123 });

      fetch.dispose();
      await listener.shutdown();
    });

    it('returns {pkg, pkg-digest} in headers', async () => {
      const hash = 'sha256-00000';
      const app = HttpServer.create({ pkg, hash });
      const listener = Deno.serve({ port: 0 }, app.fetch);
      app.get('/', (c) => c.text('no-op'));

      const fetch = Http.fetcher();
      const url = Http.url(listener.addr);
      const res = await fetch.text(url.raw);

      const headers = res.headers;

      // Default: lower-case.
      expect(headers.get('pkg')).to.eql(Pkg.toString(pkg));
      expect(headers.get('pkg-digest')).to.eql(hash);

      // Supports reading as capitalized version (via default Headers object).
      expect(headers.get('Pkg')).to.eql(Pkg.toString(pkg));
      expect(headers.get('Pkg-Digest')).to.eql(hash);

      /**
       * The actual header keys are lower-case.
       *
       * As per HTTP/2 and HTTP/3 specs.
       *    RFC 7540 - Hypertext Transfer Protocol Version 2 (HTTP/2)
       *    RFC 9114 - HTTP/3
       */
      const h = Http.toHeaders(headers);
      expect(h['pkg']).to.eql(Pkg.toString(pkg));
      expect(h['pkg-digest']).to.eql(hash);

      fetch.dispose();
      await listener.shutdown();
    });
  });
});
