import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Http } from '../../../mod.ts';
import { HttpProxy } from '../mod.ts';

describe('HttpProxy', () => {
  it('API', async () => {
    const m = await import('@sys/http/server');
    const direct = await import('@sys/http/server/proxy');

    expect(m.HttpProxy).to.equal(HttpProxy);
    expect(direct.HttpProxy).to.equal(HttpProxy);
    expect(HttpProxy).to.be.ok;
    expectTypeOf(HttpProxy).toMatchTypeOf<t.HttpProxy.Lib>();
  });

  it('rejects mixed advanced config and lifecycle mounts', () => {
    let error: unknown;

    try {
      HttpProxy.create({
        config: { root: { upstream: 'https://example.com/root/' as t.StringUrl } },
        mounts: [{ path: '/api/', target: 'https://example.com/api/' as t.StringUrl }],
      });
    } catch (thrown) {
      error = thrown;
    }

    expect(error).to.be.instanceOf(Error);
    expect((error as Error).message).to.contain('use either config or mounts');
  });

  it('starts as a managed lifecycle endpoint and proxies POST bodies', async () => {
    const upstreamApp = Http.Server.create({ static: false, cors: false });
    upstreamApp.post('/-/stripe/payment-intent', async (c) => {
      const url = new URL(c.req.raw.url);
      return c.json({
        method: c.req.raw.method,
        pathname: url.pathname,
        search: url.search,
        header: c.req.raw.headers.get('x-proxy-test'),
        body: await c.req.raw.text(),
      });
    });

    const upstream = Http.Server.start(upstreamApp, { port: 0, silent: true });
    const proxy = await HttpProxy.start({
      name: 'test:proxy',
      hostname: '127.0.0.1',
      port: 0,
      silent: true,
      mounts: [{ path: '/-/stripe/', target: `${upstream.origin}/-/stripe/` as t.StringUrl }],
    });

    try {
      const res = await fetch(`${proxy.origin}/-/stripe/payment-intent?x=1`, {
        method: 'POST',
        headers: { 'content-type': 'text/plain', 'x-proxy-test': 'post' },
        body: 'hello',
      });
      const body = await res.json();

      expect(res.status).to.eql(200);
      expect(body).to.eql({
        method: 'POST',
        pathname: '/-/stripe/payment-intent',
        search: '?x=1',
        header: 'post',
        body: 'hello',
      });
    } finally {
      await proxy.close('test.proxy');
      await upstream.close('test.upstream');
    }

    expect(proxy.disposed).to.eql(true);
    expect(upstream.disposed).to.eql(true);
  });
});
