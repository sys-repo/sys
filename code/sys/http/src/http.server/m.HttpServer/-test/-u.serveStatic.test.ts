import { describe, expect, it, Time } from '../../../-test.ts';
import { Fs, Is } from '../common.ts';
import { Http } from '../../../http.client/mod.ts';
import { HttpServer } from '../mod.ts';
import { forceDirSlashWith } from '../u/u.middleware.ts';
import { serveStaticWith } from '../u/u.serveStatic.ts';
import { testFetcher, usingServer } from './u.fixture.usingServer.ts';

/**
 * Invariant:
 * Request paths stay lexically within the static root.
 * Static JSON assets must never be stale under browser caching.
 */
describe('HttpServer: serve static', () => {
  const sampleBinary = (length = 500) => Uint8Array.from({ length }, (_, i) => i % 256);

  it('encoded sibling traversal → 403 without sibling content or SPA fallback', async () => {
    await using fs = await fixture();
    const root = fs.join('dist');
    await Fs.ensureDir(root);
    await Fs.write(fs.join('dist-secret/secret.txt'), 'private sibling', { throw: true });
    const misses: string[] = [];
    const app = new HttpServer.Hono();
    app.use(
      '*',
      HttpServer.static({
        root,
        onNotFound(path, c) {
          misses.push(path);
          c.res = c.text('SPA fallback');
        },
      }),
    );
    const composed = HttpServer.create({ static: ['/*', root] });
    const paths = [
      '/..%2Fdist-secret/secret.txt',
      '/%2e%2e%2fdist-secret%2fsecret.txt',
      '/nested%2F..%2F..%2Fdist-secret%2Fsecret.txt',
      '/..%2Fdist-secret/missing.txt',
    ];
    for (const server of [app, composed]) {
      for (const path of paths) {
        const res = await server.fetch(new Request(`http://local${path}`));
        const body = await res.text();
        expect(res.status, path).to.eql(403);
        expect(body).to.eql('Forbidden');
      }
    }
    expect(misses).to.eql([]);
  });

  it('escaped targets → zero stat and fallback calls; in-root miss → both called', async () => {
    for (const root of [Fs.resolve('dist'), 'dist', 'dist/']) {
      let stats = 0;
      let misses = 0;
      const app = new HttpServer.Hono();
      app.use(
        '*',
        serveStaticWith({
          root,
          onNotFound(_path, c) {
            misses++;
            c.res = c.text('SPA fallback');
          },
        }, () => {
          stats++;
          return Promise.resolve(undefined);
        }),
      );
      const escaped = await app.fetch(new Request('http://local/..%2Fdist-secret/secret.txt'));
      const body = await escaped.text();
      expect(stats).to.eql(0);
      expect(misses).to.eql(0);
      expect(escaped.status).to.eql(403);
      expect(body).to.eql('Forbidden');

      const allowed = await app.fetch(new Request('http://local/missing.txt'));
      expect(await allowed.text()).to.eql('SPA fallback');
      expect(allowed.status).to.eql(200);
      expect(stats).to.eql(1);
      expect(misses).to.eql(1);
    }
  });

  it('absolute, relative and default roots → files and directory indexes', async () => {
    // A non-dot-prefixed cwd fixture avoids the old '.' prefix check's accidental success.
    await using fs = await fixture('cwd');
    await Fs.write(fs.join('index.html'), 'root index', { throw: true });
    await Fs.write(fs.join('nested/space name.txt'), 'nested payload', { throw: true });
    const relative = Fs.Path.relative(Fs.cwd(), fs.dir);
    const localPrefix = `${Fs.Path.relativePosix(relative)}/`;
    const cases = [
      { root: fs.dir, prefix: '' },
      { root: `${fs.dir}/.`, prefix: '' },
      { root: relative, prefix: '' },
      { root: undefined, prefix: localPrefix },
      { root: '.', prefix: localPrefix },
      { root: '', prefix: localPrefix },
    ];
    for (const { root, prefix } of cases) {
      const app = new HttpServer.Hono();
      app.use('*', HttpServer.static(root === undefined ? {} : { root }));
      for (
        const [path, expected] of [
          ['', 'root index'],
          ['index.html', 'root index'],
          ['nested/space%20name.txt', 'nested payload'],
          ['nested%2F..%2Findex.html', 'root index'],
        ]
      ) {
        const res = await app.fetch(new Request(`http://local/${prefix}${path}`));
        const body = await res.text();
        expect(res.status, `${root}: ${path}`).to.eql(200);
        expect(body).to.eql(expected);
      }
    }
  });

  it('missing in-root file → custom SPA fallback with the decoded request path', async () => {
    await using fs = await fixture();
    const misses: string[] = [];
    const app = new HttpServer.Hono();
    app.use(
      '*',
      HttpServer.static({
        root: fs.dir,
        onNotFound(path, c) {
          misses.push(path);
          c.res = c.text('SPA fallback');
        },
      }),
    );
    const res = await app.fetch(new Request('http://local/missing%20route'));
    expect(await res.text()).to.eql('SPA fallback');
    expect(res.status).to.eql(200);
    expect(misses).to.eql(['/missing route']);
  });

  it('POSIX backslash names → exact bytes', { ignore: Deno.build.os === 'windows' }, async () => {
    await using fs = await fixture();
    const root = fs.join('dist');
    const cases = [
      ['..\\report.txt', '/..%5Creport.txt', 'native parent-like name'],
      ['name\\part.txt', '/name%5Cpart.txt', 'native backslash name'],
      ['\\..\\report.txt', '/%5C..%5Creport.txt', 'native leading backslash'],
    ];
    for (const [name, , expected] of cases) {
      const path = Fs.join(root, name);
      await Fs.write(path, expected, { throw: true });
      const read = await Fs.readText(path);
      expect(read.ok, name).to.eql(true);
      expect(read.data, name).to.eql(expected);
    }
    const direct = new HttpServer.Hono();
    direct.use('*', HttpServer.static(root));
    const composed = HttpServer.create({ static: ['/*', root] });
    for (const app of [direct, composed]) {
      for (const [, path, expected] of cases) {
        const res = await app.fetch(new Request(`http://local${path}`));
        const body = await res.text();
        expect(res.status, path).to.eql(200);
        expect(body, path).to.eql(expected);
      }
    }
  });

  it('percent, space and dot-prefix names → exact bytes after one decode', async () => {
    await using fs = await fixture();
    const cases = [
      ['literal%.txt', '/literal%25.txt', 'percent payload'],
      ['space name.txt', '/space%20name.txt', 'space payload'],
      ['%2Freport.txt', '/%252Freport.txt', 'encoded separator filename'],
      ['..literal.txt', '/..literal.txt', 'dot-prefix payload'],
    ];
    for (const [name, , expected] of cases) {
      await Fs.write(fs.join(name), expected, { throw: true });
    }
    const direct = new HttpServer.Hono();
    direct.use('*', HttpServer.static(fs.dir));
    const composed = HttpServer.create({ static: ['/*', fs.dir] });
    for (const app of [direct, composed]) {
      for (const [, path, expected] of cases) {
        const res = await app.fetch(new Request(`http://local${path}`));
        const body = await res.text();
        expect(res.status, path).to.eql(200);
        expect(body, path).to.eql(expected);
      }
    }
  });

  it('directory redirects → request origin, port, path and query preserved', async () => {
    await using fs = await fixture();
    await Fs.write(fs.join('evil.invalid/index.html'), 'directory index', { throw: true });
    const direct = new HttpServer.Hono();
    direct.use('*', HttpServer.forceDirSlash(fs.dir));
    const composed = HttpServer.create({ static: ['/*', fs.dir] });
    const query = '?keep=a%2Fb&value=%25';
    for (const app of [direct, composed]) {
      for (const path of ['/evil.invalid', '//evil.invalid', '///evil.invalid']) {
        const href = `http://local:4321${path}${query}`;
        const res = await app.fetch(new Request(href));
        await res.arrayBuffer();
        expect(res.status, href).to.eql(308);
        const location = res.headers.get('location');
        if (!Is.string(location)) throw new Error('Expected a directory redirect Location.');
        const redirected = new URL(location, href);
        expect(redirected.origin, href).to.eql('http://local:4321');
        expect(redirected.pathname, href).to.eql(`${path}/`);
        expect(redirected.search, href).to.eql(query);
      }
      const missing = await app.fetch(new Request('http://local:4321//missing.invalid'));
      await missing.arrayBuffer();
      expect(missing.status).to.eql(404);
      expect(missing.headers.get('location')).to.eql(null);
    }
  });

  it('encoded directory collision → refusal unchanged; double encoding → literal name', async () => {
    await using fs = await fixture();
    const root = fs.join('dist');
    await Fs.ensureDir(root);
    await Fs.write(fs.join('dist-secret/index.html'), 'outside index', { throw: true });
    const direct = new HttpServer.Hono();
    direct.use('*', HttpServer.static(root));
    const composed = HttpServer.create({ static: ['/*', root] });
    for (const present of [false, true]) {
      if (present) {
        await Fs.write(
          Fs.join(root, '..%2Fdist-secret/index.html'),
          'literal index',
          { throw: true },
        );
      }
      for (const app of [direct, composed]) {
        const res = await app.fetch(new Request('http://local/..%2Fdist-secret'));
        const body = await res.text();
        expect(res.status, `collision present=${present}`).to.eql(403);
        expect(res.headers.get('location')).to.eql(null);
        expect(body).to.eql('Forbidden');
      }
    }

    const href = 'http://local/..%252Fdist-secret?mode=a%2Fb';
    const redirect = await composed.fetch(new Request(href));
    await redirect.arrayBuffer();
    expect(redirect.status).to.eql(308);
    expect(redirect.headers.get('location')).to.eql('/..%252Fdist-secret/?mode=a%2Fb');
    for (const app of [direct, composed]) {
      const res = await app.fetch(new Request('http://local/..%252Fdist-secret/'));
      const body = await res.text();
      expect(res.status).to.eql(200);
      expect(body).to.eql('literal index');
    }
  });

  it('middleware escape → zero directory lookups or next calls; descendant → lookup', async () => {
    for (const root of [Fs.resolve('dist'), 'dist', 'dist/']) {
      const lookups: (string | URL)[] = [];
      let nextCalls = 0;
      const app = new HttpServer.Hono();
      app.use(
        '*',
        forceDirSlashWith(root, '/', (path) => {
          lookups.push(path);
          return Promise.resolve(false);
        }),
      );
      app.get('*', (c) => {
        nextCalls++;
        return c.text('fallthrough');
      });
      for (const path of ['/..%2Fdist-secret', '/..%2Fdist-secret/']) {
        const res = await app.fetch(new Request(`http://local${path}`));
        const body = await res.text();
        expect(lookups, path).to.eql([]);
        expect(nextCalls, path).to.eql(0);
        expect(res.status, path).to.eql(403);
        expect(body).to.eql('Forbidden');
      }

      const allowed = await app.fetch(new Request('http://local/folder'));
      expect(await allowed.text()).to.eql('fallthrough');
      expect(allowed.status).to.eql(200);
      expect(lookups).to.eql([Fs.resolve(root, 'folder')]);
      expect(nextCalls).to.eql(1);

      const slashed = await app.fetch(new Request('http://local/folder/'));
      expect(await slashed.text()).to.eql('fallthrough');
      expect(slashed.status).to.eql(200);
      expect(lookups).to.eql([Fs.resolve(root, 'folder')]);
      expect(nextCalls).to.eql(2);
    }
  });

  it('middleware strip and root forms → decoded directories without remapping routes', async () => {
    await using fs = await fixture('cwd');
    await Fs.write(fs.join('space dir/index.html'), 'space index', { throw: true });
    await Fs.write(fs.join('literal%dir/index.html'), 'percent index', { throw: true });
    await Fs.write(fs.join('mount/raw/index.html'), 'unstripped index', { throw: true });
    const relative = Fs.Path.relative(Fs.cwd(), fs.dir);
    const localPrefix = `${Fs.Path.relativePosix(relative)}/`;
    const roots = [
      { root: fs.dir, prefix: '' },
      { root: `${fs.dir}/.`, prefix: '' },
      { root: relative, prefix: '' },
      { root: '.', prefix: localPrefix },
      { root: '', prefix: localPrefix },
    ];
    const directories = [
      ['space%20dir', 'space index'],
      ['literal%25dir', 'percent index'],
    ];
    for (const { root, prefix } of roots) {
      const app = HttpServer.create({ static: ['/*', root] });
      for (const [path, expected] of directories) {
        const href = `http://local/${prefix}${path}?keep=%25`;
        const redirect = await app.fetch(new Request(href));
        await redirect.arrayBuffer();
        expect(redirect.status, href).to.eql(308);
        expect(redirect.headers.get('location')).to.eql(`/${prefix}${path}/?keep=%25`);
        const res = await app.fetch(new Request(`http://local/${prefix}${path}/`));
        const body = await res.text();
        expect(res.status).to.eql(200);
        expect(body).to.eql(expected);
      }
    }

    const stripped = new HttpServer.Hono();
    stripped.use('*', HttpServer.forceDirSlash(fs.dir, '/mount/'));
    const redirect = await stripped.fetch(new Request('http://local/mount/space%20dir?keep=%25'));
    await redirect.arrayBuffer();
    expect(redirect.status).to.eql(308);
    expect(redirect.headers.get('location')).to.eql('/mount/space%20dir/?keep=%25');
    const refused = await stripped.fetch(new Request('http://local/mount/..%2Foutside'));
    await refused.arrayBuffer();
    expect(refused.status).to.eql(403);
    expect(refused.headers.get('location')).to.eql(null);

    const unstripped = HttpServer.create({ static: ['/mount/*', fs.dir] });
    const res = await unstripped.fetch(new Request('http://local/mount/raw/'));
    const body = await res.text();
    expect(res.status).to.eql(200);
    expect(body).to.eql('unstripped index');
  });

  it('200: simple JSON', async () => {
    type T = { count: number; msg?: string };
    const foo: T = { msg: 'hello', count: 123 };
    await using fs = await fixture();
    const filename = 'foo.json';
    await Fs.writeJson(Fs.join(fs.dir, filename), foo);

    const app = HttpServer.create({ static: ['/*', fs.dir] });

    await usingServer({
      app,
      fn: async ({ url, fetch }) => {
        const res = await fetch.json<T>(url.join(filename));

        expect(res.status).to.eql(200);
        expect(res.headers.get('Content-Type')).to.eql('application/json; charset=UTF-8');
        expect(res.data).to.eql(foo);
      },
    });
  });

  it('200: canonical known and unknown Content-Type values', async () => {
    await using fs = await fixture();
    await Fs.write(Fs.join(fs.dir, 'config.yaml'), 'enabled: true');
    await Fs.write(Fs.join(fs.dir, 'value.unknown'), new Uint8Array([1, 2, 3]));

    const app = HttpServer.create({ static: ['/*', fs.dir] });
    const known = await app.fetch(new Request('http://local/config.yaml'));
    const knownBody = await known.text();
    const unknown = await app.fetch(new Request('http://local/value.unknown'));
    const unknownBody = new Uint8Array(await unknown.arrayBuffer());

    expect(known.status).to.eql(200);
    expect(known.headers.get('content-type')).to.eql('text/yaml; charset=UTF-8');
    expect(knownBody).to.eql('enabled: true');

    expect(unknown.status).to.eql(200);
    expect(unknown.headers.get('content-type')).to.eql('application/octet-stream');
    expect(unknownBody).to.eql(new Uint8Array([1, 2, 3]));
  });

  it('200/404: HTML/Blob(Binary)/404', async () => {
    const data = sampleBinary();
    await using fs = await fixture();
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
        expect(a.headers.get('content-type')).to.eql('application/octet-stream');
        expect(await Http.toUint8Array(a.data)).to.eql(data);

        expect(b.status).to.eql(200);
        expect(b.headers.get('content-type')).to.eql('text/html; charset=UTF-8');
        expect(b.data).to.eql('<h1>🐷</h1>');

        expect(c.status).to.eql(200);
        expect(c.headers.get('content-type')).to.eql('text/html; charset=UTF-8');
        expect(c.data).to.eql('<h1>🐷</h1>');

        expect(d.status).to.eql(200);
        expect(d.headers.get('content-type')).to.eql('text/html; charset=UTF-8');
        expect(d.data).to.eql('<h1>🌳</h1>');

        expect(e.status).to.eql(404);
        expect(f.status).to.eql(404);
      },
    });
  });

  it('308: redirects directory path to trailing slash', async () => {
    await using fs = await fixture();
    await Fs.write(Fs.join(fs.dir, 'bar/index.html'), '<h1>🌳</h1>');

    const app = HttpServer.create({ static: ['/*', fs.dir] });
    const res = await app.fetch(new Request('http://local/bar'));
    await res.arrayBuffer();

    expect(res.status).to.eql(308);
    expect(res.headers.get('location')).to.eql('/bar/');
  });

  it('206: Partial Content', async () => {
    /**
     * NOTE: 206/Partial-Content is used in video file streaming.
     */
    const data = sampleBinary(500);
    await using fs = await fixture();
    const filename = 'foo.bin';
    await Fs.write(Fs.join(fs.dir, filename), data);

    const app = HttpServer.create({ static: ['/*', fs.dir] });

    await usingServer({
      app,
      mkFetch: (origin) =>
        testFetcher(origin, {
          policy: { credentialOrigins: [origin] },
          headers: (event) => event.set('range', 'bytes=0-'),
        }),
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
    await using fs = await fixture();
    const filename = 'etag.json';
    await Fs.writeJson(Fs.join(fs.dir, filename), { ok: true });

    const app = HttpServer.create({ static: ['/*', fs.dir] });
    const href = `http://local/${filename}`;

    const res1 = await app.fetch(new Request(href));
    const etag = res1.headers.get('etag');
    await res1.arrayBuffer(); // Drain before assertions so a failure cannot strand the file handle.
    expect(res1.status).to.eql(200);
    expect(etag).to.be.ok;

    const res2 = await app.fetch(new Request(href, { headers: { 'if-none-match': String(etag) } }));
    await res2.arrayBuffer();
    expect(res2.status).to.eql(304);
  });

  it('ETag changes after file rewrite', async () => {
    type T = { ok: boolean };
    await using fs = await fixture();
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

  it('same-size JSON rewrite + fixed metadata → changed bytes and ETag, not stale 304', async () => {
    await using fs = await fixture();
    const filename = 'etag-change-fast.json';
    const path = Fs.join(fs.dir, filename);
    const before = '{"value":"one"}';
    const after = '{"value":"two"}';
    await Fs.write(path, before, { throw: true });
    const info = await Fs.stat(path);
    if (!info?.isFile) throw new Error('Expected a JSON fixture file.');

    // Hold every supplied metadata field fixed; only the on-disk JSON bytes change.
    const metadata = { ...info, mtime: new Date(0) };
    const app = new HttpServer.Hono();
    app.use(
      '*',
      serveStaticWith({ root: fs.dir }, (candidate) => {
        expect(candidate).to.eql(path);
        return Promise.resolve(metadata);
      }),
    );
    const href = `http://local/${filename}`;

    const initial = await app.fetch(new Request(href));
    const initialBody = await initial.text();
    const etag = initial.headers.get('etag');
    expect(initial.status).to.eql(200);
    expect(initialBody).to.eql(before);
    if (!Is.string(etag)) throw new Error('Expected an initial ETag.');

    const headers = { 'if-none-match': etag };
    const cached = await app.fetch(new Request(href, { headers }));
    await cached.arrayBuffer();
    expect(cached.status).to.eql(304);
    expect(cached.headers.get('etag')).to.eql(etag);

    await Fs.write(path, after, { throw: true });
    const rewritten = await Fs.stat(path);
    expect(rewritten?.size).to.eql(info.size);

    const changed = await app.fetch(new Request(href, { headers }));
    const changedBody = await changed.text();
    const changedEtag = changed.headers.get('etag');
    expect(changed.status).to.eql(200);
    expect(changedBody).to.eql(after);
    if (!Is.string(changedEtag)) throw new Error('Expected a rewritten ETag.');
    expect(changedEtag).not.to.eql(etag);
  });
});

/** Each case owns its directory through setup, assertions and response drainage. */
async function fixture(location: 'os-temp' | 'cwd' = 'os-temp') {
  const fs = await Fs.makeTempDir({
    dir: location === 'cwd' ? '.' : undefined,
    prefix: 'http-static-',
  });
  return {
    ...fs,
    dir: fs.absolute,
    async [Symbol.asyncDispose]() {
      await Fs.remove(fs.absolute);
    },
  };
}
