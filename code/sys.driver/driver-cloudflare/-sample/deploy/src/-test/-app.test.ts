import { R2 } from '@sys/driver-cloudflare/r2';
import { describe, expect, it, type t, Time, WebFixture } from '../-test.ts';
import { createApp } from '../u.app.ts';
import { artifactFrom, configFrom, LIMITS, routesFor } from '../u.selection.ts';

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

describe('R2 deployment sample: one origin', () => {
  it('maps only the selected artifact beneath the literal mount', async () => {
    using f = fixture();
    for (
      const [path, key] of [
        ['/ui/', 'index.html'],
        ['/ui/index.html', 'index.html'],
        ['/ui/pkg/file.js', 'pkg/file.js'],
        ['/ui/dist.json', 'dist.json'],
      ]
    ) {
      const res = await f.request(path);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.eql('selected bytes');
      expect(f.signed.at(-1)).to.eql(`sample/ui/${key}`);
      headers(res);
    }
    expect(f.fetched.every((req) => req.method === 'GET')).to.eql(true);
  });

  it('redirects only /ui and never discards its query', async () => {
    using f = fixture();
    for (const method of ['GET', 'HEAD']) {
      const res = await f.request('/ui', { method });
      expect(res.status).to.eql(308);
      expect(res.headers.get('location')).to.eql('/ui/');
      expect(await res.text()).to.eql('');
      headers(res);
    }
    expect((await f.request('/ui?msg=hello')).status).to.eql(400);
    expect(f.signed).to.eql([]);
  });

  it('answers JSON without storage, escaping data rather than constructing HTML', async () => {
    using f = fixture();
    for (const value of [undefined, '', 'hello', '<script>"&', '😀'.repeat(64)]) {
      const path = value === undefined
        ? '/api/hello'
        : `/api/hello?msg=${encodeURIComponent(value)}`;
      const res = await f.request(path);
      expect(res.status).to.eql(200);
      expect(await res.json()).to.eql({ msg: `${value ?? 'hello'} world!` });
      expect(res.headers.get('content-type')).to.include('application/json');
      headers(res);
    }
    const get = await f.request('/api/hello?msg=hello');
    const head = await f.request('/api/hello?msg=hello', { method: 'HEAD' });
    expect([...head.headers]).to.eql([...get.headers]);
    expect(await head.text()).to.eql('');
    expect(f.signed).to.eql([]);
  });

  it('refuses unsupported input before storage and never supplies fallback HTML', async () => {
    using f = fixture();
    const cases = [
      ['/api/hello?msg=a&msg=b', 400],
      ['/api/hello?other=x', 400],
      [`/api/hello?msg=${'a'.repeat(129)}`, 400],
      [`/api/hello?msg=${encodeURIComponent('😀'.repeat(65))}`, 400],
      ['/ui/?q=1', 400],
      ['/ui/pkg/file.js?q=1', 400],
      ['/ui/pkg/%66ile.js', 400],
      ['/ui/pkg%2Ffile.js', 400],
      ['/ui/%ZZ', 400],
      ['/ui/missing.js', 404],
      ['/ui/pkg/', 400],
      ['/uix/', 404],
      ['/ui%2Fpkg/file.js', 404],
      ['/%75i/', 404],
      ['/api/%68ello', 404],
      ['/', 404],
      ['/index.html', 404],
      ['/config.json', 404],
      ['/api/hello/', 404],
    ] as const;
    for (const [path, status] of cases) {
      const res = await f.request(path);
      expect(res.status, path).to.eql(status);
      expect(await res.text(), path).to.eql('');
      headers(res);
    }
    for (const path of ['/ui', '/ui/', '/ui/pkg/file.js', '/api/hello']) {
      for (const method of ['POST', 'OPTIONS', 'PUT', 'DELETE']) {
        const res = await f.request(path, { method });
        expect(res.status, `${method} ${path}`).to.eql(405);
        expect(res.headers.get('allow')).to.eql('GET, HEAD');
        headers(res);
      }
    }
    const range = await f.request('/ui/pkg/file.js', { headers: { Range: 'bytes=0-1' } });
    expect(range.status).to.eql(416);
    expect(f.signed).to.eql([]);
    expect(f.fetched).to.eql([]);
  });

  it('keeps GET/HEAD representation headers and strips browser authority', async () => {
    using f = fixture();
    const get = await f.request('/ui/pkg/file.js');
    const head = await f.request('/ui/pkg/file.js', {
      method: 'HEAD',
      headers: { Cookie: 'private', Authorization: 'private' },
    });
    expect(head.status).to.eql(200);
    expect([...head.headers]).to.eql([...get.headers]);
    expect(head.headers.get('content-type')).to.include('javascript');
    expect(head.headers.get('content-length')).to.eql('14');
    expect(await head.text()).to.eql('');
    expect(await get.text()).to.eql('selected bytes');
    expect([...f.fetched.at(-1)!.headers]).to.eql([]);
  });

  it('preserves missing-object responses after admitted storage work', async () => {
    using f = fixture(() => Promise.resolve(new Response(null, { status: 404 })));
    const res = await f.request('/ui/pkg/file.js');
    expect(res.status).to.eql(404);
    expect(f.signed).to.eql(['sample/ui/pkg/file.js']);
    expect(await res.text()).to.eql('');
    headers(res);
  });

  it('propagates caller cancellation through the mount into the storage fetch fixture', async () => {
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
});

describe('R2 deployment sample: local authority', () => {
  it('projects a copied selection without mutation or remote discovery', () => {
    const input = { ...artifact, files: [...artifact.files] };
    const selected = artifactFrom(input);
    input.files.push('unadmitted.js');
    expect(selected.files).to.eql(artifact.files);
    expect(routesFor(configFrom(config), selected)).to.eql({
      '/': 'sample/ui/index.html',
      '/index.html': 'sample/ui/index.html',
      '/pkg/file.js': 'sample/ui/pkg/file.js',
      '/dist.json': 'sample/ui/dist.json',
    });
  });

  it('rejects missing, ambiguous, oversized or unsupported authority', () => {
    for (
      const input of [
        undefined,
        {},
        { ...config, accountId: 'wrong' },
        { ...config, prefix: '../other' },
        { ...config, bucket: 'bucket/other' },
        { ...config, limits: { ...LIMITS, maxBytes: LIMITS.maxBytes + 1 } },
      ]
    ) {
      expect(() => configFrom(input)).to.throw('Invalid sample configuration.');
    }
    for (
      const files of [
        [],
        ['index.html'],
        ['dist.json'],
        [...artifact.files, 'index.html'],
        [...artifact.files, '../secret'],
        [...artifact.files, 'pkg/%66ile.js'],
        [...artifact.files, 'a'.repeat(513)],
        [...artifact.files, ...Array.from({ length: 256 }, (_, index) => `f${index}`)],
      ]
    ) {
      expect(() => artifactFrom({ ...artifact, files })).to.throw('Invalid sample artifact.');
    }
    expect(() => artifactFrom({ ...artifact, integrity: 'untrusted' })).to.throw();
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
    return read ? read(req) : Promise.resolve(
      new Response('selected bytes', {
        headers: { 'Set-Cookie': 'must-not-escape', 'X-Provider': 'must-not-escape' },
      }),
    );
  });
  const request = (path: string, init?: RequestInit) =>
    app.fetch(new Request(`http://sample.test${path}`, init));
  return { request, signed, fetched, dispose: mock.dispose, [Symbol.dispose]: mock.dispose };
}

function headers(response: Response) {
  expect(response.headers.get('cache-control')).to.eql('no-store');
  expect(response.headers.get('x-content-type-options')).to.eql('nosniff');
  expect(response.headers.has('access-control-allow-origin')).to.eql(false);
  expect(response.headers.has('set-cookie')).to.eql(false);
  expect(response.headers.has('x-provider')).to.eql(false);
}
