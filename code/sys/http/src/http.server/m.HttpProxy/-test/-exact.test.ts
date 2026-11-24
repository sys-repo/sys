import { describe, expect, Fs, it, type t, Testing, Yaml } from '../../../-test.ts';
import { Http } from '../../../mod.ts';
import { HttpProxyResolver } from '../m/m.Resolver.ts';
import { HttpProxy } from '../mod.ts';

type Arrival = { pathname: string; authorization: string | null; origin: string | null };

const AUTH = 'Bearer proxy-test-only';
const ORIGIN = 'https://caller.example';
const CALLER = { Authorization: AUTH, Origin: ORIGIN };
const LISTEN = { hostname: '127.0.0.1', port: 0, silent: true, origin: 'exact-loopback' } as const;
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
    const commandCalls: Arrival[] = [];
    let viewCalls = 0;
    commandApp.all('*', async (c) => {
      commandCalls.push(arrival(c.req.raw));
      const { method, url, headers } = c.req.raw;
      const { pathname, search } = new URL(url);
      if (pathname === '/read') return c.redirect('/other', 307);

      const header = headers.get('x-proxy-test');
      const body = await c.req.raw.text();
      return c.json({ method, pathname, search, header, body }, 201);
    });
    viewApp.all('*', (c) => {
      viewCalls++;
      return c.json(arrival(c.req.raw));
    });

    await using command = Http.Server.start(commandApp, LISTEN);
    await using view = Http.Server.start(viewApp, LISTEN);
    await using proxy = await startFromYaml({
      root: { target: `${view.origin}/site/`, stripAuthorization: true },
      mounts: [{ path: '/commands/', target: `${view.origin}/mount/` }],
      exactRoutes: [
        { ...ROUTE, target: `${command.origin}/submit` },
        { path: READ, method: 'GET', target: `${command.origin}/read` },
      ],
    });
    const origin = `http://${LISTEN.hostname}:${proxy.port}`;
    const runUrl = `${origin}${RUN}`;
    const readUrl = `${origin}${READ}`;

    for (const method of ['GET', 'HEAD', 'OPTIONS', 'PUT']) {
      const response = await fetch(runUrl, { method, headers: CALLER, redirect: 'manual' });
      expect(response.status, method).to.eql(405);
      expect(response.headers.get('allow'), method).to.eql('POST');
      await response.text();
    }
    const head = await fetch(readUrl, { method: 'HEAD', redirect: 'manual' });
    expect(head.status).to.eql(405);
    expect(head.headers.get('allow')).to.eql('GET');

    const slash = await fetch(`${origin}/commands?x=1`, { headers: CALLER, redirect: 'manual' });
    expect(slash.status).to.eql(308);
    expect(slash.headers.get('location')).to.eql('/commands/?x=1');
    await slash.text();
    expect(commandCalls).to.eql([]);
    expect(viewCalls).to.eql(0);

    const viewRoutes = [
      [`${RUN}/`, '/mount/run/', AUTH],
      [`${RUN}/next`, '/mount/run/next', AUTH],
      ['/commands/runs', '/mount/runs', AUTH],
      ['/commands%2Frun', '/site/commands%2Frun', null],
      ['/commands/report:daily', '/mount/report:daily', AUTH],
      ['/report:daily', '/site/report:daily', null],
      ['/', '/site/', null],
    ] as const;
    for (const [path, pathname, authorization] of viewRoutes) {
      const response = await fetch(`${origin}${path}`, {
        method: 'POST',
        headers: CALLER,
        redirect: 'manual',
      });
      expect(response.status, path).to.eql(200);
      expect(await response.json(), path).to.eql({ pathname, authorization, origin: ORIGIN });
    }
    const anonymous = await fetch(`${origin}/commands/runs`, { redirect: 'manual' });
    const anonymousMount = { pathname: '/mount/runs', authorization: null, origin: null };
    expect(await anonymous.json()).to.eql(anonymousMount);
    expect(commandCalls).to.eql([]);

    const response = await fetch(`${runUrl}?x=1`, {
      method: 'POST',
      headers: { ...CALLER, 'x-proxy-test': 'exact' },
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

    const anonymousCommand = await fetch(runUrl, { method: 'POST', redirect: 'manual' });
    expect(anonymousCommand.status).to.eql(201);
    await anonymousCommand.text();

    const redirect = await fetch(readUrl, { headers: CALLER, redirect: 'manual' });
    expect(redirect.status).to.eql(307);
    expect(redirect.headers.get('location')).to.eql('/other');
    await redirect.text();
    expect(commandCalls).to.eql([
      { pathname: '/submit', authorization: AUTH, origin: ORIGIN },
      { pathname: '/submit', authorization: null, origin: null },
      { pathname: '/read', authorization: AUTH, origin: ORIGIN },
    ]);
    expect(viewCalls).to.eql(viewRoutes.length + 1);
  });
});

describe('HttpProxy → YAML root authorization', () => {
  const policies = [
    ['omitted', {}, AUTH],
    ['false', { stripAuthorization: false }, AUTH],
    ['true', { stripAuthorization: true }, null],
  ] as const;
  for (const [name, policy, forwarded] of policies) {
    it(`stripAuthorization ${name} → upstream receives the selected headers`, async () => {
      const app = Http.Server.create({ static: false, cors: false });
      app.all('*', (c) => c.json(arrival(c.req.raw)));
      await using view = Http.Server.start(app, LISTEN);
      await using proxy = await startFromYaml({ root: { target: `${view.origin}/`, ...policy } });
      const url = `http://${LISTEN.hostname}:${proxy.port}/page`;
      const cases: [HeadersInit, string | null, string | null][] = [
        [CALLER, forwarded, ORIGIN],
        [{ Authorization: AUTH }, forwarded, null],
        [{ Origin: ORIGIN }, null, ORIGIN],
        [{}, null, null],
      ];
      for (const [headers, authorization, origin] of cases) {
        const response = await fetch(url, { headers, redirect: 'manual' });
        expect(await response.json()).to.eql({ pathname: '/page', authorization, origin });
      }
    });
  }
});

function arrival(request: Request): Arrival {
  const { headers, url } = request;
  return {
    pathname: new URL(url).pathname,
    authorization: headers.get('authorization'),
    origin: headers.get('origin'),
  };
}

async function startFromYaml(
  routes: Pick<t.HttpProxy.CreateOptions, 'root' | 'mounts' | 'exactRoutes'>,
) {
  const fs = await Testing.dir('HttpProxy.routes');
  const config = fs.join('proxy.yaml');
  const { hostname, port } = LISTEN;
  const doc = Yaml.stringify({ name: 'proxy', hostname, port, mounts: [], ...routes });
  if (doc.error) throw doc.error;
  await Fs.write(config, doc.data);
  return await HttpProxy.start({ paths: { config }, silent: true });
}

function createRoute(overrides: Partial<t.HttpProxy.ExactRoute>) {
  return HttpProxy.create({ exactRoutes: [{ ...ROUTE, ...overrides }] });
}
