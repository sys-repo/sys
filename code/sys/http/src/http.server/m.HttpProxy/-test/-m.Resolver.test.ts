import { describe, expect, it } from '../../../-test.ts';
import { Http } from '../../../mod.ts';
import { HttpProxyResolver } from '../m.Resolver.ts';
import { HttpProxy } from '../mod.ts';
import { usingServer } from './u.fixture.usingServer.ts';

describe('HttpProxyResolver', () => {
  it('root fallback → shared path algebra for deep upstream paths', () => {
    const resolve = HttpProxyResolver({
      root: {
        upstream: 'https://example.com/site/',
        response: { headers: { 'cache-control': 'no-store' } },
      },
    });

    expect(resolve('/')).to.eql({
      kind: 'root',
      upstream: 'https://example.com/site/',
      response: { headers: { 'cache-control': 'no-store' } },
    });

    expect(resolve('/about')).to.eql({
      kind: 'root',
      upstream: 'https://example.com/site/about',
      response: { headers: { 'cache-control': 'no-store' } },
    });
  });

  it('mount → root and asset paths resolve under mounted upstream root', () => {
    const resolve = HttpProxyResolver({
      mounts: [
        {
          mountPath: '/slc/',
          upstream: 'https://example.com/bundle/',
          response: { headers: { 'cache-control': 'no-store' } },
        },
      ],
    });

    expect(resolve('/slc/')).to.eql({
      kind: 'mount',
      upstream: 'https://example.com/bundle/',
      response: { headers: { 'cache-control': 'no-store' } },
    });

    expect(resolve('/slc/pkg/-entry.js')).to.eql({
      kind: 'mount',
      upstream: 'https://example.com/bundle/pkg/-entry.js',
      response: { headers: { 'cache-control': 'no-store' } },
    });
  });

  it('mount matching → longest-prefix wins', () => {
    const resolve = HttpProxyResolver({
      mounts: [
        { mountPath: '/foo/', upstream: 'https://example.com/a/' },
        { mountPath: '/foo/bar/', upstream: 'https://example.com/b/' },
      ],
    });

    expect(resolve('/foo/bar/pkg/entry.js')).to.eql({
      kind: 'mount',
      upstream: 'https://example.com/b/pkg/entry.js',
    });
  });

  it('redirect → exact mount path without slash', () => {
    const resolve = HttpProxyResolver({
      mounts: [{ mountPath: '/slc/', upstream: 'https://example.com/bundle/' }],
    });

    expect(resolve('/slc')).to.eql({
      kind: 'redirect',
      location: '/slc/',
    });
  });

  it('validation → rejects mountPath /', () => {
    expectThrowMessage(
      () =>
        HttpProxyResolver({
          mounts: [{ mountPath: '/', upstream: 'https://example.com/bundle/' }],
        }),
      `mountPath '/' is invalid`,
    );
  });

  it('validation → rejects duplicate mountPath', () => {
    expectThrowMessage(
      () =>
        HttpProxyResolver({
          mounts: [
            { mountPath: '/slc/', upstream: 'https://example.com/a/' },
            { mountPath: '/slc/', upstream: 'https://example.com/b/' },
          ],
        }),
      'duplicate mountPath',
    );
  });

  it('validation → rejects upstreams without trailing slash', () => {
    expectThrowMessage(
      () =>
        HttpProxyResolver({
          root: { upstream: 'https://example.com/root' },
        }),
      `must end with '/'`,
    );

    expectThrowMessage(
      () =>
        HttpProxyResolver({
          mounts: [{ mountPath: '/slc/', upstream: 'https://example.com/bundle' }],
        }),
      `must end with '/'`,
    );
  });

  it('validation → rejects upstreams with query strings or hash fragments', () => {
    expectThrowMessage(
      () =>
        HttpProxyResolver({
          root: { upstream: 'https://example.com/root/?x=1' },
        }),
      'must not include query or hash',
    );

    expectThrowMessage(
      () =>
        HttpProxyResolver({
          mounts: [{ mountPath: '/slc/', upstream: 'https://example.com/bundle/#frag/' }],
        }),
      'must not include query or hash',
    );
  });

  it('mounts → different local paths may share one upstream', () => {
    const resolve = HttpProxyResolver({
      mounts: [
        { mountPath: '/foo/', upstream: 'https://example.com/shared/' },
        { mountPath: '/bar/', upstream: 'https://example.com/shared/' },
      ],
    });

    expect(resolve('/bar/pkg/-entry.js')).to.eql({
      kind: 'mount',
      upstream: 'https://example.com/shared/pkg/-entry.js',
    });
  });

  it('encoded slash pathname → does not match a normalized mount prefix', () => {
    const resolve = HttpProxyResolver({
      mounts: [{ mountPath: '/slc/', upstream: 'https://example.com/bundle/' }],
    });

    const url = new URL('http://local/slc%2Fpkg/-entry.js');
    expect(resolve(url.pathname)).to.eql({ kind: 'none' });
  });
});

describe('HttpProxy → runtime', () => {
  it('root fallback → proxies path, query, and headers over real HTTP', async () => {
    const upstream = mkEchoApp('root');

    await usingServer({
      app: upstream,
      fn: async ({ url: upstreamUrl }) => {
        const app = HttpProxy.create({
          config: {
            root: { upstream: joinUrl(upstreamUrl.raw, 'site/') },
          },
        });

        await usingServer({
          app,
          fn: async ({ url }) => {
            const res = await fetch(joinUrl(url.raw, 'about?x=1'), {
              headers: { 'x-proxy-test': 'root' },
            });
            const data = await res.json();

            expect(res.status).to.eql(200);
            expect(data).to.eql({
              tag: 'root',
              method: 'GET',
              pathname: '/site/about',
              search: '?x=1',
              header: 'root',
            });
          },
        });
      },
    });
  });

  it('mount forwarding → proxies deep local mount paths and preserves query strings', async () => {
    const upstream = mkEchoApp('mount');

    await usingServer({
      app: upstream,
      fn: async ({ url: upstreamUrl }) => {
        const app = HttpProxy.create({
          config: {
            mounts: [
              {
                mountPath: '/foo/bar/slc/',
                upstream: joinUrl(upstreamUrl.raw, 'bundle/'),
              },
            ],
          },
        });

        await usingServer({
          app,
          fn: async ({ url }) => {
            const res = await fetch(
              joinUrl(url.raw, 'foo/bar/slc/images/ui.Programme/start/slc-image.png?x=1'),
              { headers: { 'x-proxy-test': 'mount' } },
            );
            const data = await res.json();

            expect(res.status).to.eql(200);
            expect(data).to.eql({
              tag: 'mount',
              method: 'GET',
              pathname: '/bundle/images/ui.Programme/start/slc-image.png',
              search: '?x=1',
              header: 'mount',
            });
          },
        });
      },
    });
  });

  it('redirect → preserves query strings', async () => {
    const app = HttpProxy.create({
      config: {
        mounts: [{ mountPath: '/slc/', upstream: 'https://example.com/bundle/' }],
      },
    });

    await usingServer({
      app,
      fn: async ({ url }) => {
        const res = await fetch(joinUrl(url.raw, 'slc?x=1'), { redirect: 'manual' });

        expect(res.status).to.eql(308);
        expect(res.headers.get('location')).to.eql('/slc/?x=1');
        await res.text();
      },
    });
  });

  it('redirect → is intentional for non-GET methods', async () => {
    const app = HttpProxy.create({
      config: {
        mounts: [{ mountPath: '/slc/', upstream: 'https://example.com/bundle/' }],
      },
    });

    await usingServer({
      app,
      fn: async ({ url }) => {
        const res = await fetch(joinUrl(url.raw, 'slc'), {
          method: 'POST',
          body: 'hello',
          redirect: 'manual',
        });

        expect(res.status).to.eql(308);
        expect(res.headers.get('location')).to.eql('/slc/');
        await res.text();
      },
    });
  });

  it('encoded slash runtime behavior → does not route as a mount match', async () => {
    const app = HttpProxy.create({
      config: {
        mounts: [{ mountPath: '/slc/', upstream: 'https://example.com/bundle/' }],
      },
    });

    await usingServer({
      app,
      fn: async ({ url }) => {
        const res = await fetch(joinUrl(url.raw, 'slc%2Fpkg/-entry.js'));
        expect(res.status).to.eql(404);
        await res.text();
      },
    });
  });

  it('upstream failure → returns 502 Bad Gateway', async () => {
    const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    const addr = listener.addr as Deno.NetAddr;
    listener.close();

    const app = HttpProxy.create({
      config: {
        root: { upstream: `http://127.0.0.1:${addr.port}/down/` },
      },
    });

    await usingServer({
      app,
      fn: async ({ url }) => {
        const res = await fetch(joinUrl(url.raw, 'about'));
        const body = await res.text();

        expect(res.status).to.eql(502);
        expect(body).to.eql('Bad Gateway');
      },
    });
  });

  it('root response headers → override upstream response headers', async () => {
    const upstream = mkEchoApp('root');

    await usingServer({
      app: upstream,
      fn: async ({ url: upstreamUrl }) => {
        const app = HttpProxy.create({
          config: {
            root: {
              upstream: joinUrl(upstreamUrl.raw, 'site/'),
              response: { headers: { 'cache-control': 'no-store' } },
            },
          },
        });

        await usingServer({
          app,
          fn: async ({ url }) => {
            const res = await fetch(joinUrl(url.raw, 'about'));

            expect(res.status).to.eql(200);
            expect(res.headers.get('cache-control')).to.eql('no-store');
            await res.json();
          },
        });
      },
    });
  });

  it('mount response headers → apply only to the matched mount', async () => {
    const upstream = mkEchoApp('mount');

    await usingServer({
      app: upstream,
      fn: async ({ url: upstreamUrl }) => {
        const app = HttpProxy.create({
          config: {
            root: { upstream: joinUrl(upstreamUrl.raw, 'site/') },
            mounts: [
              {
                mountPath: '/data/',
                upstream: joinUrl(upstreamUrl.raw, 'data/'),
                response: { headers: { 'cache-control': 'no-store' } },
              },
            ],
          },
        });

        await usingServer({
          app,
          fn: async ({ url }) => {
            const dataRes = await fetch(joinUrl(url.raw, 'data/pkg.json'));
            expect(dataRes.status).to.eql(200);
            expect(dataRes.headers.get('cache-control')).to.eql('no-store');
            await dataRes.json();

            const rootRes = await fetch(joinUrl(url.raw, 'about'));
            expect(rootRes.status).to.eql(200);
            expect(rootRes.headers.get('cache-control')).to.eql('public, max-age=60');
            await rootRes.json();
          },
        });
      },
    });
  });
});

function mkEchoApp(tag: string) {
  const app = Http.Server.create({ static: false, cors: false });

  app.all('*', async (c) => {
    const url = new URL(c.req.raw.url);
    return c.json(
      {
        tag,
        method: c.req.raw.method,
        pathname: url.pathname,
        search: url.search,
        header: c.req.raw.headers.get('x-proxy-test'),
      },
      200,
      { 'cache-control': 'public, max-age=60' },
    );
  });

  return app;
}

function expectThrowMessage(fn: () => void, pattern: string): void {
  let error: unknown;

  try {
    fn();
  } catch (thrown) {
    error = thrown;
  }

  expect(error).to.be.ok;
  expect(String((error as Error).message ?? error)).to.include(pattern);
}

function joinUrl(base: string, path: string): string {
  return new URL(path, base).href;
}
