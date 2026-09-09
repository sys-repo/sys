import { Cli, describe, expect, expectTypeOf, Fs, it, type t, Testing } from '../../../-test.ts';
import { Http } from '../../../mod.ts';
import { HttpProxy } from '../mod.ts';

describe('HttpProxy', () => {
  it('API', async () => {
    const m = await import('@sys/http/server');
    const direct = await import('@sys/http/server/proxy');

    expect(m.HttpProxy).to.equal(HttpProxy);
    expect(direct.HttpProxy).to.equal(HttpProxy);
    expect(HttpProxy).to.be.ok;
    expect(HttpProxy.Config).to.be.ok;
    expect(HttpProxy.Root).to.be.ok;
    expect(HttpProxy.Mount).to.be.ok;
    expectTypeOf(HttpProxy).toMatchTypeOf<t.HttpProxy.Lib>();
  });

  it('rejects mixed advanced config and lifecycle mounts', () => {
    let error: unknown;

    try {
      HttpProxy.create({
        config: { root: { upstream: 'http://127.0.0.1:4040/root/' as t.StringUrl } },
        mounts: [{ path: '/api/', target: 'http://127.0.0.1:4040/api/' as t.StringUrl }],
      });
    } catch (thrown) {
      error = thrown;
    }

    expect(error).to.be.instanceOf(Error);
    expect((error as Error).message).to.contain('use either config or lifecycle root/mounts');
  });

  it('prints startup URLs from structured lifecycle proxy routes', async () => {
    const lines: string[] = [];
    const original = console.info;
    console.info = (...args: unknown[]) => lines.push(args.map(String).join(' '));

    let server: t.HttpServer.Started | undefined;
    try {
      server = await HttpProxy.start({
        port: 0,
        root: { target: 'http://127.0.0.1:4040/root/' as t.StringUrl },
        mounts: [
          { path: '/payments/', target: 'http://127.0.0.1:4040/payments/' as t.StringUrl },
          { path: '/-/fixture/', target: 'http://127.0.0.1:4040/-/fixture/' as t.StringUrl },
        ],
      });
    } finally {
      console.info = original;
    }

    try {
      const output = Cli.stripAnsi(lines.join('\n'));
      expect(output).to.contain(`http://localhost:${server.port}/`);
      expect(output).to.contain(`http://localhost:${server.port}/payments/`);
      expect(output).to.contain(`http://localhost:${server.port}/-/fixture/`);
      expect(output).not.to.contain('route.payments');
      expect(output).not.to.contain('route.-.fixture');
    } finally {
      await server?.close('test.proxy.print');
    }
  });

  it('starts from a config-ref args shape', async () => {
    const fs = await Testing.dir('HttpProxy.config-ref');
    const upstreamApp = Http.Server.create({ static: false, cors: false });
    upstreamApp.get('/hello', (c) => c.text('config-ref'));
    const upstream = Http.Server.start(upstreamApp, { port: 0, silent: true });
    await Fs.write(
      Fs.join(fs.dir, '-config/proxy.yaml'),
      `name: proxy\nhostname: 127.0.0.1\nport: 0\nroot:\n  target: ${upstream.origin}/\nmounts: []\n`,
    );

    const proxy = await HttpProxy.start({
      cwd: fs.dir,
      paths: { config: Fs.join(fs.dir, '-config/proxy.yaml') },
      silent: true,
    });

    try {
      expect(proxy.status()).to.eql({
        state: 'ready',
        kind: 'proxy',
        name: 'proxy',
        config: Fs.join(fs.dir, '-config/proxy.yaml'),
        urls: [{ href: `${proxy.origin}/`, label: 'root' }],
      });

      const res = await fetch(`${proxy.origin}/hello`);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.eql('config-ref');
    } finally {
      await proxy.close('test.proxy.config-ref');
      await upstream.close('test.upstream.config-ref');
    }
  });

  it('starts as a managed lifecycle endpoint and proxies POST bodies', async () => {
    const upstreamApp = Http.Server.create({ static: false, cors: false });
    upstreamApp.post('/-/fixture/echo', async (c) => {
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
      mounts: [{ path: '/-/fixture/', target: `${upstream.origin}/-/fixture/` as t.StringUrl }],
    });

    try {
      expect(proxy.status()).to.eql({
        state: 'ready',
        kind: 'proxy',
        name: 'test:proxy',
        urls: [{ href: `${proxy.origin}/-/fixture/`, label: 'route.-.fixture' }],
      });

      const res = await fetch(`${proxy.origin}/-/fixture/echo?x=1`, {
        method: 'POST',
        headers: { 'content-type': 'text/plain', 'x-proxy-test': 'post' },
        body: 'hello',
      });
      const body = await res.json();

      expect(res.status).to.eql(200);
      expect(body).to.eql({
        method: 'POST',
        pathname: '/-/fixture/echo',
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
