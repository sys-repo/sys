import { describe, expect, it, Testing, Time } from '../../../-test.ts';
import { Fs, Http } from '../common.ts';
import { HttpServer } from '../mod.ts';
import { usingServer } from './u.fixture.usingServer.ts';

/**
 * Invariant:
 * Static JSON assets must never be stale under browser caching.
 */
describe('HttpServer: serve static', () => {
  const sampleBinary = (length = 500) => Uint8Array.from({ length }, (_, i) => i % 256);

  it('200: simple JSON', async () => {
    type T = { count: number; msg?: string };
    const foo: T = { msg: 'hello', count: 123 };
    const fs = await Testing.dir('HttpServer');
    const filename = 'foo.json';
    await Fs.writeJson(Fs.join(fs.dir, filename), foo);

    const app = HttpServer.create({ static: ['/*', fs.dir] });

    await usingServer({
      app,
      fn: async ({ url, fetch }) => {
        const res = await fetch.json<T>(url.join(filename));

        expect(res.status).to.eql(200);
        expect(res.headers.get('Content-Type')).to.include('application/json');
        expect(res.data).to.eql(foo);
      },
    });
  });

  it('200/404: HTML/Blob(Binary)/404', async () => {
    const data = sampleBinary();
    const fs = await Testing.dir('HttpServer');
    await Fs.write(Fs.join(fs.dir, 'bar/foo.bin'), data);
    await Fs.write(Fs.join(fs.dir, 'index.html'), '<h1>🐷</h1>');
    await Fs.write(Fs.join(fs.dir, 'bar/index.html'), '<h1>🌳</h1>');

    const app = HttpServer.create({ static: ['/*', fs.dir] });

    await usingServer({
      app,
      fn: async ({ url, fetch }) => {
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
      },
    });
  });

  it('308: redirects directory path to trailing slash', async () => {
    const fs = await Testing.dir('HttpServer');
    await Fs.write(Fs.join(fs.dir, 'bar/index.html'), '<h1>🌳</h1>');

    const app = HttpServer.create({ static: ['/*', fs.dir] });
    const res = await app.fetch(new Request('http://local/bar'));

    expect(res.status).to.eql(308);
    expect(res.headers.get('location')).to.eql('/bar/');
  });

  it('206: Partial Content', async () => {
    /**
     * NOTE: 206/Partial-Content is used in video file streaming.
     */
    const data = sampleBinary(500);
    const fs = await Testing.dir('HttpServer');
    const filename = 'foo.bin';
    await Fs.write(Fs.join(fs.dir, filename), data);

    const app = HttpServer.create({ static: ['/*', fs.dir] });

    await usingServer({
      app,
      mkFetch: () => Http.fetcher({ headers: (e) => e.set('range', 'bytes=0-') }),
      fn: async ({ url, fetch }) => {
        const res = await fetch.blob(url.join(filename));

        expect(res.status).to.eql(206);
        expect(res.statusText).to.eql('Partial Content');
        expect(res.headers.get('accept-ranges')).to.eql('bytes');
        expect(res.headers.get('content-length')).to.eql('500');
        expect(res.headers.get('content-range')).to.eql('bytes 0-499/500');
        expect(res.headers.get('content-type')).to.eql('application/octet-stream');
        expect(await Http.toUint8Array(res.data)).to.eql(data);
      },
    });
  });

  it('304: ETag short-circuit', async () => {
    const fs = await Testing.dir('HttpServer');
    const filename = 'etag.json';
    await Fs.writeJson(Fs.join(fs.dir, filename), { ok: true });

    const app = HttpServer.create({ static: ['/*', fs.dir] });
    const href = `http://local/${filename}`;

    /**
     * Note: `If-None-Match` is a forbidden header in Fetch, so test via app.fetch.
     */
    const res1 = await app.fetch(new Request(href));
    const etag = res1.headers.get('etag');
    expect(res1.status).to.eql(200);
    expect(etag).to.be.ok;
    if (res1.body) await res1.arrayBuffer(); // drain to close file handle

    const res2 = await app.fetch(new Request(href, { headers: { 'if-none-match': String(etag) } }));
    expect(res2.status).to.eql(304);
    if (res2.body) await res2.arrayBuffer();
  });

  it('ETag changes after file rewrite', async () => {
    type T = { ok: boolean };
    const fs = await Testing.dir('HttpServer');
    const filename = 'etag-change.json';
    const path = Fs.join(fs.dir, filename);
    await Fs.writeJson(path, { ok: true });

    const app = HttpServer.create({ static: ['/*', fs.dir] });

    await usingServer({
      app,
      fn: async ({ url, fetch }) => {
        const href = url.join(filename);

        const res1 = await fetch.json<T>(href);
        const etag1 = res1.headers.get('etag');
        expect(res1.status).to.eql(200);
        expect(etag1).to.be.ok;

        await Time.wait(1100);
        await Fs.writeJson(path, { ok: false });

        const res2 = await fetch.json<T>(href);
        const etag2 = res2.headers.get('etag');
        expect(res2.status).to.eql(200);
        expect(etag2).to.be.ok;
        expect(etag2).not.to.eql(etag1);
      },
    });
  });

  /**
   * This test exists because mtime resolution is insufficient
   * to detect fast, same-size JSON rewrites.
   *
   * Without a content-based ETag, browsers can legally cache
   * stale manifests forever.
   *
   * If this test fails, caching correctness has regressed.
   */
  it('ETag changes after JSON rewrite without waiting', async () => {
    type T = { ok: boolean };

    const fs = await Testing.dir('HttpServer');
    const filename = 'etag-change-fast.json';
    const path = Fs.join(fs.dir, filename);
    await Fs.writeJson(path, { ok: true });

    const app = HttpServer.create({ static: ['/*', fs.dir] });

    await usingServer({
      app,
      fn: async ({ url, fetch }) => {
        const href = url.join(filename);

        const res1 = await fetch.json<T>(href);
        const etag1 = res1.headers.get('etag');
        expect(res1.status).to.eql(200);
        expect(etag1).to.be.ok;

        // Rewrite immediately (no sleep).
        await Fs.writeJson(path, { ok: false });

        const res2 = await fetch.json<T>(href);
        const etag2 = res2.headers.get('etag');
        expect(res2.status).to.eql(200);
        expect(etag2).to.be.ok;

        // This is the whole point: content-hash ETag should change even within same mtime tick.
        expect(etag2).not.to.eql(etag1);
      },
    });
  });
});
