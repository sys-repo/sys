import { describe, expect, it, pkg, Testing } from '../../-test.ts';
import { Fs, Http, Pkg } from './common.ts';
import { HttpServer } from './mod.ts';

describe('HTTP: Server', () => {
  describe('HttpServer: create → fetch', () => {
    it('app: start → req/res → dispose', async () => {
      const app = HttpServer.create();
      const listener = Deno.serve({ port: 0 }, app.fetch);

      type T = { count: number };
      app.get('/', (c) => c.json({ count: 123 }));

      const fetch = Http.fetch();
      const url = Http.url(listener.addr);
      const res1 = await fetch.json<T>(url.base);
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

      const fetch = Http.fetch();
      const url = Http.url(listener.addr);
      const res = await fetch.text(url.base);

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

  describe('HttpServer: serve static', () => {
    const sampleBinary = (length = 500) => Uint8Array.from({ length }, (_, i) => i % 256);

    it('200: simple JSON', async () => {
      type T = { count: number; msg?: string };
      const foo: T = { msg: 'hello', count: 123 };
      const fs = await Testing.dir('HttpServer').create();
      const filename = 'foo.json';
      await Fs.writeJson(Fs.join(fs.dir, filename), foo);

      const app = HttpServer.create({ static: ['/*', fs.dir] });
      const listener = Deno.serve({ port: 0 }, app.fetch);

      const fetch = Http.fetch();
      const url = Http.url(listener.addr);
      const res = await fetch.json<T>(url.join(filename));

      expect(res.status).to.eql(200);
      expect(res.headers.get('Content-Type')).to.include('application/json');
      expect(res.data).to.eql(foo);

      fetch.dispose();
      await listener.shutdown();
    });

    it('200/404: HTML/Blob(Binary)/404', async () => {
      const data = sampleBinary();
      const fs = await Testing.dir('HttpServer').create();
      await Fs.write(Fs.join(fs.dir, 'bar/foo.bin'), data);
      await Fs.write(Fs.join(fs.dir, 'index.html'), '<h1>🐷</h1>');
      await Fs.write(Fs.join(fs.dir, 'bar/index.html'), '<h1>🌳</h1>');

      const app = HttpServer.create({ static: ['/*', fs.dir] });
      const listener = Deno.serve({ port: 0 }, app.fetch);
      const url = Http.url(listener.addr);
      const fetch = Http.fetch();

      const a = await fetch.blob(url.join('bar/foo.bin'));
      const b = await fetch.text(url.join('index.html'));
      const c = await fetch.text(url.join('/')); //         ← resolves to /index.html
      const d = await fetch.text(url.join('/bar')); //      ← resolves to /bar/index.html
      const e = await fetch.json(url.join('/foo/404.json'));
      const f = await fetch.json(url.join('/foo'));

      expect(a.status).to.eql(200);
      expect(a.headers.get('content-type')).to.include('application/octet-stream');
      expect(await Http.toUint8Array(a.data)).to.eql(data);

      expect(b.status).to.eql(200);
      expect(b.headers.get('content-type')).to.include('text/html');
      expect(b.data).to.eql('<h1>🐷</h1>');

      expect(c.status).to.eql(200);
      expect(c.headers.get('content-type')).to.include('text/html');
      expect(c.data).to.eql('<h1>🐷</h1>');

      expect(d.status).to.eql(200);
      expect(d.headers.get('content-type')).to.include('text/html');
      expect(d.data).to.eql('<h1>🌳</h1>');

      expect(e.status).to.eql(404);
      expect(f.status).to.eql(404);

      fetch.dispose();
      await listener.shutdown();
    });

    it('206: Partial Content', async () => {
      /**
       * NOTE: 206/Partial-Content is used in video file streaming.
       */
      const data = sampleBinary(500);
      const fs = await Testing.dir('HttpServer').create();
      const filename = 'foo.bin';
      await Fs.write(Fs.join(fs.dir, filename), data);

      const app = HttpServer.create({ static: ['/*', fs.dir] });
      const listener = Deno.serve({ port: 0 }, app.fetch);

      const fetch = Http.fetch({ headers: (e) => e.set('range', 'bytes=0-') });
      const url = Http.url(listener.addr);
      const res = await fetch.blob(url.join(filename));

      console.log('res', res);
      console.log('res.headers', res.headers);

      expect(res.status).to.eql(206);
      expect(res.statusText).to.eql('Partial Content');
      expect(res.headers.get('accept-ranges')).to.eql('bytes');
      expect(res.headers.get('content-length')).to.eql('500');
      expect(res.headers.get('content-range')).to.eql('bytes 0-499/500');
      expect(res.headers.get('content-type')).to.eql('application/octet-stream');
      expect(await Http.toUint8Array(res.data)).to.eql(data);

      fetch.dispose();
      await listener.shutdown();
    });
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
