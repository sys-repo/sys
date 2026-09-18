import { describe, expect, it, type t, WebFixture } from '../../-test.ts';
import { R2 } from '../mod.ts';
import {
  expectResponsePolicy,
  forbidFetch,
  origin,
  request,
  secret,
  setup,
} from './u.fixture.readRoute.ts';
import { accountId, credentials } from './u.fixture.ts';

describe('R2.ReadRoute', () => {
  describe('configuration', () => {
    it('captures routes, limits, authorization, and signer selection at construction', async () => {
      const routes = { '/': 'index.html', '/space%20%25%23/%E9%9B%AA': 'objects/space %#/雪' };
      const limits = { maxBytes: 8, timeout: 1000, maxConcurrent: 1 };
      const { handler, options, signed } = setup({ routes, limits });
      routes['/'] = 'replaced.html';
      limits.maxBytes = 1;
      options.bucket.presignGet = () => {
        throw new Error('Replaced signer');
      };
      options.authorize = () => false;
      using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(new Response('hello')));

      for (const path of ['/', '/space%20%25%23/%E9%9B%AA']) {
        const response = await handler(request(path));
        expect(response.status, path).to.eql(200);
        expect(await response.text(), path).to.eql('hello');
      }
      expect(signed).to.eql(['index.html', 'objects/space %#/雪']);
      const unmapped = await handler(request('/index.html'));
      expect(unmapped.status).to.eql(404);
    });

    it('rejects incomplete or unsafe inputs before authorization, signing, or fetch', () => {
      const { options, signed, authorized } = setup();
      const invalid: { label: string; override: Partial<t.R2.ReadRoute.CreateOptions> }[] = [
        { label: 'no signer', override: { bucket: { name: 'assets' } } },
        { label: 'bucket path', override: { bucket: { ...options.bucket, name: 'assets/other' } } },
        { label: 'public origin', override: { storageOrigin: 'https://public.example.com' } },
        { label: 'origin path', override: { storageOrigin: `${origin}/` } },
        { label: 'HTTP origin', override: { storageOrigin: origin.replace('https:', 'http:') } },
        { label: 'no authorization', override: { authorize: undefined } },
        { label: 'dot path', override: { routes: { '/a/../b': 'index.html' } } },
        { label: 'encoded dot', override: { routes: { '/%2e': 'index.html' } } },
        { label: 'parent key', override: { routes: { '/': '../secret' } } },
        { label: 'question mark', override: { routes: { '/': 'question?' } } },
        { label: 'blank key', override: { routes: { '/': ' ' } } },
      ];
      for (const field of ['maxBytes', 'timeout', 'maxConcurrent'] as const) {
        for (const value of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
          invalid.push({
            label: `${field}: ${value}`,
            override: { limits: { ...options.limits, [field]: value } },
          });
        }
      }
      invalid.push({
        label: 'timeout beyond seven days',
        override: { limits: { ...options.limits, timeout: 604_800_001 } },
      });
      using fetch = forbidFetch();
      for (const { label, override } of invalid) {
        expect(() => R2.ReadRoute.create({ ...options, ...override }), label).to.throw();
      }
      expect(authorized).to.eql([]);
      expect(signed).to.eql([]);
      expect(fetch.calls).to.eql(0);
    });
  });

  describe('request admission', () => {
    it('refuses unsupported requests and unknown paths before authorization or storage', async () => {
      using fetch = forbidFetch();
      const { handler, signed, authorized } = setup();
      const cases: { req: Request; status: number }[] = [
        { req: request('/', { method: 'POST' }), status: 405 },
        { req: request('/', { headers: { range: 'bytes=0-1' } }), status: 416 },
        { req: request('/missing.js'), status: 404 },
        { req: request('/?key=other'), status: 400 },
        { req: request('/%'), status: 400 },
        { req: request('/%2F'), status: 400 },
        { req: request('/%5C'), status: 400 },
        { req: request('/%00'), status: 400 },
        { req: request('/a//b'), status: 400 },
        { req: request('/%61ssets/app.js'), status: 400 },
        { req: request(`/${'a'.repeat(1025)}`), status: 400 },
        { req: request(`/${'%C3%A9'.repeat(513)}`), status: 400 },
      ];
      for (const { req, status } of cases) {
        const response = await handler(req);
        expect(response.status, `${req.method} ${req.url}`).to.eql(status);
        expect(await response.text()).to.eql('');
        expectResponsePolicy(response);
        if (status === 405) expect(response.headers.get('allow')).to.eql('GET, HEAD');
      }
      expect(authorized).to.eql([]);
      expect(signed).to.eql([]);
      expect(fetch.calls).to.eql(0);
    });

    it('requires explicit authorization and contains callback failures', async () => {
      using fetch = forbidFetch();
      const cases = [
        { label: 'denied', status: 403, authorize: () => false },
        {
          label: 'callback failure',
          status: 500,
          authorize() {
            throw new Error(secret);
          },
        },
      ];
      for (const { label, authorize, status } of cases) {
        const { handler, signed } = setup({ authorize });
        const response = await handler(request('/'));
        expect(response.status, label).to.eql(status);
        expect(await response.text(), label).to.eql('');
        expect(signed, label).to.eql([]);
        expectResponsePolicy(response);
      }
      expect(fetch.calls).to.eql(0);
    });
  });

  describe('storage authority', () => {
    it('uses the native presigner without forwarding browser credentials', async () => {
      const bucket = R2.Service.create({ accountId, credentials }).bucket('assets');
      const { handler } = setup({ bucket });
      let fetched = 0;
      using _fetch = WebFixture.Fetch.mock((input, init) => {
        fetched++;
        const url = new URL(String(input));
        expect(url.origin).to.eql(origin);
        expect(url.pathname).to.eql('/assets/index.html');
        expect(url.searchParams.get('X-Amz-Expires')).to.eql('1');
        expect(url.searchParams.get('X-Amz-Signature')).to.match(/^[a-f0-9]{64}$/);
        expect([...new Headers(init?.headers)]).to.eql([]);
        return Promise.resolve(new Response('hello'));
      });
      const req = request('/', {
        headers: { authorization: 'Bearer browser-SECRET', cookie: 'session=SECRET' },
      });
      const response = await handler(req);
      expect(response.status).to.eql(200);
      expect(await response.text()).to.eql('hello');
      expect(fetched).to.eql(1);
    });

    it('rejects changed signing targets and signing failures before fetch', async () => {
      using fetch = forbidFetch();
      const urls = [
        `https://other.example/assets/index.html?token=${secret}`,
        `${origin}/other/index.html?token=${secret}`,
        `${origin}/assets/other.html?token=${secret}`,
        `${origin}/assets/index.html#${secret}`,
        `https://user:password@${new URL(origin).host}/assets/index.html`,
        secret,
      ];
      for (const url of urls) {
        const bucket = { name: 'assets', presignGet: () => Promise.resolve(url) };
        const response = await setup({ bucket }).handler(request('/'));
        expect(response.status, url).to.eql(502);
        expect(await response.text()).to.eql('');
        expectResponsePolicy(response);
      }
      const bucket = { name: 'assets', presignGet: () => Promise.reject(new Error(secret)) };
      const response = await setup({ bucket }).handler(request('/'));
      expect(response.status).to.eql(502);
      expect(await response.text()).to.eql('');
      expect(fetch.calls).to.eql(0);
    });
  });

  describe('HTTP responses', () => {
    it('GET/HEAD share bytes and metadata without inheriting provider headers', async () => {
      const calls: { url: string; init?: RequestInit }[] = [];
      using _fetch = WebFixture.Fetch.mock((input, init) => {
        calls.push({ url: String(input), init });
        const headers = {
          'content-type': 'application/wrong',
          'content-encoding': 'gzip',
          'content-length': '9999',
          'cache-control': 'public',
          'set-cookie': 'upstream=SECRET',
          etag: 'upstream-etag',
        };
        // Model bytes already decoded by Fetch. This proves projection, not decompression.
        return Promise.resolve(new Response('hello', { headers }));
      });
      const { handler, signed, authorized } = setup();
      const get = await handler(request('/'));
      const head = await handler(request('/', { method: 'HEAD' }));
      expect(get.status).to.eql(200);
      expect(head.status).to.eql(200);
      expect(await get.text()).to.eql('hello');
      expect(await head.text()).to.eql('');
      expect([...head.headers]).to.eql([...get.headers]);
      expect(get.headers.get('content-type')).to.eql('text/html; charset=UTF-8');
      expect(get.headers.get('content-length')).to.eql('5');
      expect(get.headers.get('content-encoding')).to.eql(null);
      expect(get.headers.get('set-cookie')).to.eql(null);
      expect(get.headers.get('etag')).to.eql(null);
      expectResponsePolicy(get);
      expect(authorized).to.eql(['index.html', 'index.html']);
      expect(signed).to.eql(['index.html', 'index.html']);
      expect(calls.length).to.eql(2);
      for (const { url, init } of calls) {
        expect(url).to.eql(`${origin}/assets/index.html?token=${secret}`);
        expect(init?.method).to.eql('GET');
        expect(init?.redirect).to.eql('manual');
        expect(init?.credentials).to.eql('omit');
        expect(init?.referrer).to.eql('');
        expect(init?.referrerPolicy).to.eql('no-referrer');
        expect([...new Headers(init?.headers)]).to.eql([]);
      }
    });

    it('closes refused bodies without leaking errors or following redirects', async () => {
      for (const upstream of [301, 302, 307, 308, 403, 404, 500, 206]) {
        let cancelled = 0;
        let fetched = 0;
        using _fetch = WebFixture.Fetch.mock(() => {
          fetched++;
          const body = new ReadableStream<Uint8Array>({
            cancel() {
              cancelled++;
            },
          });
          const location = `https://other.example/?token=${secret}`;
          const headers = { location, 'x-secret': secret };
          return Promise.resolve(new Response(body, { status: upstream, headers }));
        });
        const response = await setup().handler(request('/'));
        expect(response.status, String(upstream)).to.eql(upstream === 404 ? 404 : 502);
        expect(await response.text()).to.eql('');
        expect(response.headers.get('location')).to.eql(null);
        expect(response.headers.get('x-secret')).to.eql(null);
        expect(cancelled).to.eql(1);
        expect(fetched).to.eql(1);
        expectResponsePolicy(response);
      }
    });

    it('refuses partial representations and unsupported compression', async () => {
      const cases: { label: string; headers: HeadersInit }[] = [
        { label: 'partial body', headers: { 'content-range': 'bytes 0-1/8' } },
        { label: 'unknown encoding', headers: { 'content-encoding': 'unknown' } },
        { label: 'stacked encodings', headers: { 'content-encoding': 'gzip, br' } },
      ];
      for (const { label, headers } of cases) {
        let cancelled = 0;
        using _fetch = WebFixture.Fetch.mock(() => {
          const body = new ReadableStream<Uint8Array>({
            cancel() {
              cancelled++;
            },
          });
          return Promise.resolve(new Response(body, { headers }));
        });
        const response = await setup().handler(request('/'));
        expect(response.status, label).to.eql(502);
        expect(await response.text(), label).to.eql('');
        expect(cancelled, label).to.eql(1);
      }
    });

    it('contains fetch and body failures, then releases capacity for another read', async () => {
      for (const stage of ['fetch', 'body'] as const) {
        let fetched = 0;
        using _fetch = WebFixture.Fetch.mock(() => {
          fetched++;
          if (fetched > 1) return Promise.resolve(new Response('ok'));
          if (stage === 'fetch') return Promise.reject(new Error(secret));
          const body = new ReadableStream<Uint8Array>({
            pull() {
              throw new Error(secret);
            },
          });
          return Promise.resolve(new Response(body));
        });
        const { handler } = setup();
        const failed = await handler(request('/'));
        expect(failed.status, stage).to.eql(502);
        expect(await failed.text()).to.eql('');
        const next = await handler(request('/'));
        expect(next.status, stage).to.eql(200);
        expect(await next.text()).to.eql('ok');
      }
    });
  });

  describe('object-size budget', () => {
    it('counts GET/HEAD bytes despite absent, invalid, or understated lengths', async () => {
      for (const method of ['GET', 'HEAD']) {
        for (const length of [undefined, 'invalid', '1']) {
          let cancelled = 0;
          using _fetch = WebFixture.Fetch.mock(() => {
            const body = new ReadableStream<Uint8Array>({
              start(controller) {
                controller.enqueue(new Uint8Array(4));
                controller.enqueue(new Uint8Array(5));
              },
              cancel() {
                cancelled++;
              },
            });
            const headers = new Headers();
            if (length !== undefined) headers.set('content-length', length);
            return Promise.resolve(new Response(body, { headers }));
          });
          const response = await setup().handler(request('/data.bin', { method }));
          expect(response.status, `${method}: ${length}`).to.eql(413);
          expect(await response.text()).to.eql('');
          expect(cancelled).to.eql(1);
          expectResponsePolicy(response);
        }
      }
    });

    it('admits empty bodies and the exact ceiling, but refuses declared overflow', async () => {
      const { handler } = setup();
      for (const size of [0, 8]) {
        using _fetch = WebFixture.Fetch.mock(() => {
          return Promise.resolve(new Response(new Uint8Array(size)));
        });
        const response = await handler(request('/data.bin'));
        const bytes = await response.arrayBuffer();
        expect(response.status).to.eql(200);
        expect(response.headers.get('content-length')).to.eql(String(size));
        expect(bytes.byteLength).to.eql(size);
      }
      let cancelled = 0;
      const body = new ReadableStream<Uint8Array>({
        cancel() {
          cancelled++;
        },
      });
      using _fetch = WebFixture.Fetch.mock(() => {
        return Promise.resolve(new Response(body, { headers: { 'content-length': '9' } }));
      });
      const response = await handler(request('/data.bin'));
      expect(response.status).to.eql(413);
      expect(cancelled).to.eql(1);
    });
  });
});
