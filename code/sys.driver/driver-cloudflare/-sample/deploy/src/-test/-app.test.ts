import { describe, expect, expectError, it, Time } from '../-test.ts';
import { createApp } from '../m.app/mod.ts';
import { configFrom } from '../m.app/u.selection.ts';
import { remoteFixture } from './u.fixture.ts';

describe('R2 deployment sample: app', () => {
  it('serves admitted index and asset bytes, including HEAD', async () => {
    using f = await fixture();
    for (const [path, key] of [['/ui/', 'index.html'], ['/ui/pkg/file.js', 'pkg/file.js']]) {
      const res = await f.request(path);
      expect(res.status).to.eql(200);
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(bytes).to.eql(f.content.get(key));
      expect(f.signed.at(-1)).to.eql(`sample/ui/${key}`);
    }
    const head = await f.request('/ui/pkg/file.js', { method: 'HEAD' });
    expect(head.status).to.eql(200);
    expect(await head.text()).to.eql('');
  });

  it('redirects / and /ui → /ui/ without further storage reads', async () => {
    using f = await fixture();
    for (const path of ['/', '/ui']) {
      const res = await f.request(path);
      expect(res.status).to.eql(308);
      expect(res.headers.get('location')).to.eql('/ui/');
    }
    expect(f.fetched).to.eql([]);
  });

  it('answers the API with shared headers and no further storage reads', async () => {
    using f = await fixture();
    for (const path of ['/api/hello', '/api/hello?msg=foo']) {
      const res = await f.request(path);
      expect(res.status).to.eql(200);
      expect(await res.json()).to.eql({ msg: '👋 hello world!' });
      expect(res.headers.get('content-type')).to.include('application/json');
      expect(res.headers.get('cache-control')).to.eql('no-store');
      expect(res.headers.get('x-content-type-options')).to.eql('nosniff');
    }
    expect(f.fetched).to.eql([]);
  });

  it('refuses invalid queries, encoded aliases and unadmitted paths before storage', async () => {
    using f = await fixture();
    const cases = [
      ['/?q=1', 400],
      ['/ui/?q=1', 400],
      ['/ui/pkg/%66ile.js', 400],
      ['/%75i/', 404],
      ['/api/%68ello', 404],
      ['/ui/unselected.js', 404],
      ['/missing', 404],
    ] as const;
    for (const [path, status] of cases) {
      const res = await f.request(path);
      expect(res.status, path).to.eql(status);
      expect(await res.text(), path).to.eql('');
    }
    expect(f.signed).to.eql([]);
    expect(f.fetched).to.eql([]);
  });

  it('rejects writes on declared routes and keeps unknown routes as 404', async () => {
    using f = await fixture();
    for (const path of ['/', '/ui', '/api/hello', '/ui/pkg/file.js']) {
      const res = await f.request(path, { method: 'POST' });
      expect(res.status, path).to.eql(405);
      expect(res.headers.get('allow')).to.eql('GET, HEAD');
    }
    const missing = await f.request('/missing', { method: 'POST' });
    expect(missing.status).to.eql(404);
    expect(missing.headers.get('cache-control')).to.eql('no-store');
    expect(missing.headers.get('x-content-type-options')).to.eql('nosniff');
    expect(f.fetched).to.eql([]);
  });

  it('passes cancellation through the UI mount', async () => {
    const started = Promise.withResolvers<AbortSignal>();
    using f = await fixture((req) => {
      started.resolve(req.signal);
      return new Promise((_resolve, reject) => {
        req.signal.addEventListener('abort', () => reject(new Error('fixture aborted')), {
          once: true,
        });
      });
    });
    const controller = new AbortController();
    const response = f.request('/ui/pkg/file.js', { signal: controller.signal });
    const timeout = Time.delay(1_000, () => {
      throw new Error('Storage fetch did not start.');
    });
    try {
      await Promise.race([started.promise, timeout]);
      controller.abort();
      const res = await response;
      expect(res.status).to.eql(499);
      const signal = await started.promise;
      expect(signal.aborted).to.eql(true);
    } finally {
      timeout.cancel();
      controller.abort();
      await response;
    }
  });

  it('rejects unsafe configuration and a mismatched bucket', async () => {
    using f = await remoteFixture();
    expect(() => configFrom({ ...f.config, prefix: '../other' })).to.throw(
      'Invalid sample configuration.',
    );
    await expectError(
      () => createApp({ ...f, bucket: { name: 'other' } }),
      'Sample bucket does not match configuration.',
    );
    expect(f.fetched).to.eql([]);
  });
});

/** Count request-time reads separately from the required bootstrap read. */
async function fixture(read?: (req: Request) => Promise<Response>) {
  const f = await remoteFixture();
  try {
    const ordinary = f.read;
    if (read) {
      f.read = (req) => {
        const isManifest = new URL(req.url).pathname.endsWith('/dist.json');
        return isManifest ? ordinary(req) : read(req);
      };
    }
    const app = await createApp(f);
    f.signed.length = 0;
    f.fetched.length = 0;
    const request = (path: string, init?: RequestInit) =>
      app.fetch(new Request(`http://sample.test${path}`, init));
    return { ...f, request };
  } catch (error) {
    f[Symbol.dispose]();
    throw error;
  }
}
