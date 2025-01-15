import { describe, expect, it, pkg } from '../../-test.ts';
import { Http, Pkg } from './common.ts';
import { HttpServer } from './mod.ts';

describe('Server', () => {
  it('app: start → req/res → dispose', async () => {
    const app = HttpServer.create();
    const listener = Deno.serve({ port: 0 }, app.fetch);

    app.get('/', (c) => c.json({ count: 123 }));

    const client = Http.client();
    const url = Http.url(listener.addr);
    const res1 = await client.get(url.base);
    const res2 = await client.get(url.join('404'));

    expect(res1.status).to.eql(200);
    expect(res2.status).to.eql(404);

    expect(await res1.json()).to.eql({ count: 123 });
    await res2.body?.cancel();

    await listener.shutdown();
  });

  it('returns {pkg, pkg-digest} in headers', async () => {
    const hash = 'sha256-00000';
    const app = HttpServer.create({ pkg, hash });
    const listener = Deno.serve({ port: 0 }, app.fetch);
    app.get('/', (c) => c.text('no-op'));

    const client = Http.client();
    const url = Http.url(listener.addr);
    const res = await client.get(url.base);
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

    await res.body?.cancel();
    await listener.shutdown();
  });

  describe('HttpServer.options', () => {
    it('overloaded params', () => {
      const port = 123;
      const pkg = { name: 'foo', version: '1.2.3' };
      const hash = '0xHash';
      const a = HttpServer.options(port, pkg, hash);
      const b = HttpServer.options(port, pkg, hash);
      const c = HttpServer.options(port, pkg, hash);
      const d = HttpServer.options();
      const e = HttpServer.options({ pkg, port, hash });
      const all = [a, b, c, d, e];
      all.forEach((item) => {
        expect(typeof item.onListen === 'function').to.eql(true);
      });
    });
  });
});
