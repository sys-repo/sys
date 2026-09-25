import { describe, expect, it, Time } from '../-test.ts';
import { createApp, routesFor } from '../m.app/mod.ts';
import { appFrom } from '../m.deployment/mod.ts';
import { fixtureEnv, remoteFixture } from './u.fixture.ts';

describe('R2 deployment sample: HTTP app', () => {
  it('redirects, API, method restrictions, and unknown routes do not invoke the shell', async () => {
    let calls = 0;
    const app = createApp({
      shell: () => {
        calls++;
        return Promise.resolve(new Response('shell'));
      },
    });
    for (const path of ['/', '/ui']) {
      for (const method of ['GET', 'HEAD']) {
        const response = await app.request(path, { method });
        expect(response.status).to.eql(308);
        expect(response.headers.get('location')).to.eql('/ui/');
        await response.body?.cancel();
      }
    }
    for (const path of ['/api/hello', '/api/hello?msg=foo']) {
      const response = await app.request(path);
      expect(response.status).to.eql(200);
      expect(await response.json()).to.eql({ msg: '👋 hello world!' });
      expect(response.headers.get('content-type')).to.include('application/json');
      expect(response.headers.get('cache-control')).to.eql('no-store');
      expect(response.headers.get('x-content-type-options')).to.eql('nosniff');
    }
    for (const path of ['/', '/ui', '/api/hello', '/ui/']) {
      const response = await app.request(path, { method: 'POST' });
      expect(response.status).to.eql(405);
      expect(response.headers.get('allow')).to.eql('GET, HEAD');
    }
    for (const path of ['/missing', '/%75i/', '/api/%68ello']) {
      const response = await app.request(path);
      expect(response.status).to.eql(404);
      expect(response.headers.get('cache-control')).to.eql('no-store');
      expect(response.headers.get('x-content-type-options')).to.eql('nosniff');
    }
    expect((await app.request('/missing', { method: 'POST' })).status).to.eql(404);
    expect((await app.request('/?q=1')).status).to.eql(400);
    expect(calls).to.eql(0);
  });

  it('maps relative shell filenames and strips the mount without decoding paths or dropping queries', async () => {
    expect(routesFor(['dist.json', 'index.html'])).to.eql({
      '/': 'index.html',
      '/dist.json': 'dist.json',
      '/index.html': 'index.html',
    });
    const seen: string[] = [];
    const app = createApp({
      shell: (req) => {
        const url = new URL(req.url);
        seen.push(`${req.method} ${url.pathname}${url.search}`);
        return Promise.resolve(new Response(null, { status: 204 }));
      },
    });
    for (const path of ['/ui/', '/ui/%69ndex.html?q=1', '/ui/index.html']) {
      expect((await app.request(path, { method: 'HEAD' })).status).to.eql(204);
    }
    expect(seen).to.eql(['HEAD /', 'HEAD /%69ndex.html?q=1', 'HEAD /index.html']);
  });
});

describe('R2 deployment sample: HTTP adapter integration', () => {
  it('serves shell GET/HEAD while refusing public assets, queries, and encoded aliases before storage', async () => {
    using f = await remoteFixture();
    const app = await appFrom(f, fixtureEnv);
    f.fetched.length = 0;
    for (
      const [path, key] of [['/ui/', 'index.html'], ['/ui/index.html', 'index.html'], [
        '/ui/dist.json',
        'dist.json',
      ]]
    ) {
      const response = await app.request(path);
      expect(response.status).to.eql(200);
      expect(new Uint8Array(await response.arrayBuffer())).to.eql(f.content.get(key));
      expect(f.keys().at(-1)).to.eql(`sample/ui/${key}`);
    }
    const head = await app.request('/ui/', { method: 'HEAD' });
    expect(head.status).to.eql(200);
    expect(await head.text()).to.eql('');
    f.fetched.length = 0;
    for (
      const [path, status] of [
        ['/ui/pkg/file.js', 404],
        ['/ui/pkg/file.css', 404],
        ['/images/wax-seal.v1.png', 404],
        ['/ui/images/wax-seal.v1.png', 404],
        ['/ui/unselected.js', 404],
        ['/ui/?q=1', 400],
        ['/ui/pkg/%66ile.js', 400],
      ] as const
    ) {
      for (const method of ['GET', 'HEAD']) {
        const response = await app.request(path, { method });
        expect(response.status, path).to.eql(status);
        expect(await response.text()).to.eql('');
        expect(response.headers.has('location')).to.eql(false);
      }
    }
    expect(f.fetched).to.eql([]);
  });

  it('passes cancellation through the UI mount to the read adapter', async () => {
    using f = await remoteFixture();
    const app = await appFrom(f, fixtureEnv);
    const started = Promise.withResolvers<AbortSignal>();
    f.read = (req) => {
      started.resolve(req.signal);
      return new Promise((_resolve, reject) => {
        req.signal.addEventListener('abort', () => reject(new Error('fixture aborted')), {
          once: true,
        });
      });
    };
    const controller = new AbortController();
    const response = app.request('/ui/', { signal: controller.signal });
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
