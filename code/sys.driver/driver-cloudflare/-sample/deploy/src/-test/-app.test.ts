import { R2 } from '@sys/driver-cloudflare/r2';
import { describe, expect, it, type t, Time, WebFixture } from '../-test.ts';
import { createApp } from '../m.app/mod.ts';
import { artifactFrom, configFrom, LIMITS } from '../m.app/u.selection.ts';

const config: t.Config = {
  accountId: '0'.repeat(32),
  bucket: 'sample',
  prefix: 'sample/ui',
  credentials: {
    accessKeyId: 'R2_SAMPLE_ACCESS_KEY_ID',
    secretAccessKey: 'R2_SAMPLE_SECRET_ACCESS_KEY',
  },
  limits: LIMITS,
};
const artifact: t.Artifact = {
  integrity: `sha256-${'0'.repeat(64)}`,
  files: ['index.html', 'pkg/file.js', 'dist.json'],
};

describe('R2 deployment sample: app', () => {
  it('serves the selected index and asset, including HEAD', async () => {
    using f = fixture();
    for (const [path, key] of [['/ui/', 'index.html'], ['/ui/pkg/file.js', 'pkg/file.js']]) {
      const res = await f.request(path);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.eql('selected bytes');
      expect(f.signed.at(-1)).to.eql(`sample/ui/${key}`);
    }
    const head = await f.request('/ui/pkg/file.js', { method: 'HEAD' });
    expect(head.status).to.eql(200);
    expect(await head.text()).to.eql('');
  });

  it('redirects / and /ui → /ui/ without storage', async () => {
    using f = fixture();
    for (const path of ['/', '/ui']) {
      const res = await f.request(path);
      expect(res.status).to.eql(308);
      expect(res.headers.get('location')).to.eql('/ui/');
    }
    expect(f.fetched).to.eql([]);
  });

  it('answers the API with shared headers and no storage', async () => {
    using f = fixture();
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

  it('refuses invalid queries, encoded aliases and unselected paths before storage', async () => {
    using f = fixture();
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
    using f = fixture();
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
    using f = fixture((req) => {
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
      expect((await response).status).to.eql(499);
      expect((await started.promise).aborted).to.eql(true);
    } finally {
      timeout.cancel();
      controller.abort();
      await response;
    }
  });

  it('rejects unsafe configuration, incomplete selection and a mismatched bucket', () => {
    expect(() => configFrom({ ...config, prefix: '../other' })).to.throw(
      'Invalid sample configuration.',
    );
    expect(() => artifactFrom({ ...artifact, files: ['dist.json'] })).to.throw(
      'Invalid sample artifact.',
    );
    expect(() => createApp({ config, artifact, bucket: { name: 'other' } })).to.throw(
      'Sample bucket does not match configuration.',
    );
  });
});

/**
 * Helpers:
 */
function fixture(read?: (req: Request) => Promise<Response>) {
  const signed: string[] = [];
  const fetched: Request[] = [];
  const bucket = {
    name: config.bucket,
    presignGet(key: string) {
      signed.push(key);
      return Promise.resolve(
        `${R2.Service.storageUrl(config.accountId)}/${config.bucket}/${key}?signature=fixture`,
      );
    },
  };
  const app = createApp({ config, artifact, bucket });
  const mock = WebFixture.Fetch.mock((input, init) => {
    const req = new Request(input, init);
    fetched.push(req);
    return read ? read(req) : Promise.resolve(new Response('selected bytes'));
  });
  const request = (path: string, init?: RequestInit) =>
    app.fetch(new Request(`http://sample.test${path}`, init));
  return { request, signed, fetched, [Symbol.dispose]: mock.dispose };
}
