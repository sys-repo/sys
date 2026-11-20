import { describe, expect, Fs, it, type t, Testing, Yaml } from '../../../-test.ts';
import { Http } from '../../../mod.ts';
import { HttpProxyResolver } from '../m/m.Resolver.ts';
import { HttpProxy } from '../mod.ts';

const RUN = '/commands/run';
const READ = '/commands/read';
const ROUTE = { path: RUN, method: 'POST', target: 'https://commands.example/submit' } as const;

describe('HttpProxy → exact routes', () => {
  it('reserves the pathname before a mount slash redirect', () => {
    const resolve = HttpProxyResolver({
      exactRoutes: [ROUTE],
      mounts: [{ mountPath: `${RUN}/`, upstream: 'https://view.example/mount/' }],
      root: { upstream: 'https://view.example/root/' },
    });

    expect(resolve(RUN, 'POST')).to.eql({ kind: 'exact', upstream: ROUTE.target });
    expect(resolve(RUN, 'GET')).to.eql({ kind: 'method-not-allowed', allow: 'POST' });
  });

  it('rejects paths that are not serialized URL pathnames', () => {
    const paths = ['commands/run', `${RUN}?`, `${RUN}#`, '/commands/../run'];
    for (const path of paths) {
      expect(() => createRoute({ path }), path).to.throw('path must be a serialized URL pathname');
    }
  });

  it('rejects unsupported HTTP methods', () => {
    const msg = 'method must be an uppercase HTTP method supported by Fetch';
    for (const method of ['post', '', 'POST GET', 'TRACE']) {
      expect(() => createRoute({ method }), `method '${method}'`).to.throw(msg);
    }
  });

  it('rejects targets with credentials, query, or fragment and requires absolute HTTP(S)', () => {
    const targets = [`${ROUTE.target}?`, `${ROUTE.target}#`, 'http://user@commands.example/run'];
    const msg = 'target must not include credentials, query, or fragment';
    for (const target of targets) {
      expect(() => createRoute({ target }), target).to.throw(msg);
    }
    const create = () => createRoute({ target: '/run' });
    expect(create).to.throw('target must be an absolute HTTP(S) URL');
  });

  it('rejects two reservations for the same pathname, even with different methods', () => {
    const exactRoutes = [ROUTE, { ...ROUTE, method: 'GET' }];
    expect(() => HttpProxy.create({ exactRoutes })).to.throw('duplicates a reserved pathname');
  });

  it('rejects mixed advanced config and lifecycle exact routes', () => {
    const create = () => HttpProxy.create({ exactRoutes: [ROUTE], config: {} });
    expect(create).to.throw('use either config or lifecycle root/mounts/exactRoutes');
  });

  it('exact-only service → the advertised URL preserves the reserved pathname', async () => {
    const path = '//reports';
    const exactRoutes = [{ ...ROUTE, path }];
    await using proxy = await HttpProxy.start({ exactRoutes, port: 0, silent: true });
    const urls = proxy.status().urls ?? [];
    expect(urls).to.eql([{ href: `${proxy.origin}${path}`, label: 'POST' }]);

    const response = await fetch(urls[0].href, { method: 'HEAD', redirect: 'manual' });
    expect(response.status).to.eql(405);
    expect(response.headers.get('allow')).to.eql('POST');
  });

  it('YAML → only the configured method and pathname reach the fixed upstream', async () => {
    const commandApp = Http.Server.create({ static: false, cors: false });
    const viewApp = Http.Server.create({ static: false, cors: false });
    let commandCalls = 0;
    const viewCalls: string[] = [];
    commandApp.all('*', async (c) => {
      commandCalls++;
      const { method, url, headers } = c.req.raw;
      const { pathname, search } = new URL(url);
      if (pathname === '/read') return c.redirect('/other', 307);

      const header = headers.get('x-proxy-test');
      const body = await c.req.raw.text();
      return c.json({ method, pathname, search, header, body }, 201);
    });
    viewApp.all('*', (c) => {
      const url = new URL(c.req.raw.url);
      viewCalls.push(url.pathname);
      return c.text('view');
    });

    const hostname = '127.0.0.1';
    const listen = { hostname, port: 0, silent: true, origin: 'exact-loopback' } as const;
    await using command = Http.Server.start(commandApp, listen);
    await using view = Http.Server.start(viewApp, listen);
    const { dir } = await Testing.dir('HttpProxy.exact');
    const config = Fs.join(dir, '-config/proxy.yaml');
    const doc = Yaml.stringify({
      name: 'proxy',
      hostname,
      port: listen.port,
      root: { target: `${view.origin}/site/` },
      mounts: [{ path: '/commands/', target: `${view.origin}/mount/` }],
      exactRoutes: [
        { ...ROUTE, target: `${command.origin}/submit` },
        { path: READ, method: 'GET', target: `${command.origin}/read` },
      ],
    });
    if (doc.error) throw doc.error;
    await Fs.write(config, doc.data);
    await using proxy = await HttpProxy.start({ paths: { config }, silent: true });
    const origin = `http://${hostname}:${proxy.port}`;
    const runUrl = `${origin}${RUN}`;
    const readUrl = `${origin}${READ}`;

    for (const method of ['GET', 'HEAD', 'OPTIONS', 'PUT']) {
      const response = await fetch(runUrl, { method, redirect: 'manual' });
      expect(response.status, method).to.eql(405);
      expect(response.headers.get('allow'), method).to.eql('POST');
      await response.text();
    }
    const head = await fetch(readUrl, { method: 'HEAD', redirect: 'manual' });
    expect(head.status).to.eql(405);
    expect(head.headers.get('allow')).to.eql('GET');
    expect(commandCalls).to.eql(0);
    expect(viewCalls).to.eql([]);

    const neighbors = [
      [`${RUN}/`, '/mount/run/'],
      [`${RUN}/next`, '/mount/run/next'],
      ['/commands/runs', '/mount/runs'],
      ['/commands%2Frun', '/site/commands%2Frun'],
      ['/commands/report:daily', '/mount/report:daily'],
      ['/report:daily', '/site/report:daily'],
    ] as const;
    for (const [path] of neighbors) {
      const response = await fetch(`${origin}${path}`, { method: 'POST', redirect: 'manual' });
      expect(response.status, path).to.eql(200);
      expect(await response.text()).to.eql('view');
    }
    expect(viewCalls).to.eql(neighbors.map(([, upstream]) => upstream));
    expect(commandCalls).to.eql(0);

    const response = await fetch(`${runUrl}?x=1`, {
      method: 'POST',
      headers: { 'x-proxy-test': 'exact' },
      body: 'hello',
      redirect: 'manual',
    });
    expect(response.status).to.eql(201);
    expect(response.headers.get('location')).to.eql(null);
    expect(await response.json()).to.eql({
      method: 'POST',
      pathname: '/submit',
      search: '?x=1',
      header: 'exact',
      body: 'hello',
    });
    expect(commandCalls).to.eql(1);

    const redirect = await fetch(readUrl, { redirect: 'manual' });
    expect(redirect.status).to.eql(307);
    expect(redirect.headers.get('location')).to.eql('/other');
    await redirect.text();
    expect(commandCalls).to.eql(2);
    expect(viewCalls).to.have.length(neighbors.length);
  });
});

function createRoute(overrides: Partial<t.HttpProxy.ExactRoute>) {
  return HttpProxy.create({ exactRoutes: [{ ...ROUTE, ...overrides }] });
}
