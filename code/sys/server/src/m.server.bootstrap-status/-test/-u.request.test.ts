import { describe, expect, it, Json } from '../../-test.ts';
import { BootstrapStatus } from '../mod.ts';
import { DEFAULT_DEPENDENCIES, startWith } from '../u/u.start.ts';
import { statusResponse } from '../u/u.response.ts';
import {
  assertPolicy,
  deterministicStart,
  direct,
  FAILURE_HTML,
  hostOf,
  NOT_FOUND_HTML,
  PAGE,
} from './u.fixture.ts';

describe('BootstrapStatus.start/request', () => {
  it('admits only the exact capability through observational methods and request policy', async () => {
    let resolves = 0;
    const { started, app } = await deterministicStart({
      pages: [{ key: 'preparing', bytes: PAGE }],
      resolve: () => {
        resolves++;
        return { kind: 'page', key: 'preparing' };
      },
    }, 'a');

    try {
      const host = hostOf(started);
      const path = new URL(started.url).pathname;
      const accepted = await direct(app, '/a'.padEnd(49, 'a'), host);
      expect(accepted.status).to.eql(200);
      assertPolicy(accepted);
      await accepted.body?.cancel();

      const head = await direct(app, path, host, {}, 'HEAD');
      expect(head.status).to.eql(200);
      expect(await head.text()).to.eql('');

      const unknown = await direct(app, '/missing', host);
      expect(unknown.status).to.eql(404);
      assertPolicy(unknown);
      expect(await unknown.text()).to.eql(NOT_FOUND_HTML);

      for (const target of [`${path}?token=ignored`, `${path}?`, `/%61${'a'.repeat(47)}`]) {
        const response = await direct(app, target, host);
        expect([target, response.status]).to.eql([target, 404]);
        await response.body?.cancel();
      }

      const method = await direct(app, path, host, {}, 'POST');
      expect(method.status).to.eql(405);
      expect(method.headers.get('allow')).to.eql('GET, HEAD');
      await method.body?.cancel();

      const wrongHost = await direct(app, path, `localhost:${new URL(started.url).port}`);
      expect(wrongHost.status).to.eql(421);
      await wrongHost.body?.cancel();

      const crossSite = await direct(app, '/missing', host, {
        cookie: 'ambient=ignored',
        'sec-fetch-site': 'cross-site',
      });
      expect(crossSite.status).to.eql(403);
      expect(crossSite.headers.get('set-cookie')).to.eql(null);
      expect(crossSite.headers.get('access-control-allow-origin')).to.eql(null);
      assertPolicy(crossSite);
      await crossSite.body?.cancel();

      for (const site of ['unexpected', '']) {
        const response = await direct(app, path, host, { 'sec-fetch-site': site });
        expect([site, response.status]).to.eql([site, 403]);
        await response.body?.cancel();
      }
      for (const site of ['same-origin', 'same-site', 'none']) {
        const response = await direct(app, path, host, { 'sec-fetch-site': site });
        expect([site, response.status]).to.eql([site, 200]);
        await response.body?.cancel();
      }
      expect(resolves).to.eql(5);
    } finally {
      await started.close('test.cleanup');
    }
  });

  it('redirects only to an exact numeric-loopback origin', async () => {
    let projection: unknown = { kind: 'page', key: 'preparing' };
    const started = await startWith({
      pages: [{ key: 'preparing', bytes: PAGE }],
      resolve: () => projection,
    }, {
      ...DEFAULT_DEPENDENCIES,
      capability: () => 'b'.repeat(48),
    });

    try {
      for (
        const origin of [
          'http://127.0.0.1:45678',
          'http://[::1]:45678',
          'http://127.0.0.1:80',
        ]
      ) {
        projection = { kind: 'redirect', origin };
        const response = await fetch(started.url, { redirect: 'manual' });
        expect([origin, response.status]).to.eql([origin, 303]);
        expect(response.headers.get('location')).to.eql(origin);
        expect(response.headers.get('content-length')).to.eql('0');
        assertPolicy(response);
        await response.body?.cancel();
      }

      for (
        const origin of [
          new URL(started.url).origin,
          'https://127.0.0.1:45678',
          'http://localhost:45678',
          'http://127.0.0.2:45678',
          'http://127.0.0.1:45678/path',
          'http://127.0.0.1:45678?query=true',
          'http://user:secret@127.0.0.1:45678',
        ]
      ) {
        projection = { kind: 'redirect', origin };
        const response = await fetch(started.url, { redirect: 'manual' });
        expect([origin, response.status]).to.eql([origin, 500]);
        expect(response.headers.get('location')).to.eql(null);
        expect(await response.text()).to.eql(FAILURE_HTML);
        assertPolicy(response);
      }
    } finally {
      await started.close('test.cleanup');
    }
  });

  it('rejects hostile, asynchronous, and malformed resolver projections', async () => {
    let projection: unknown = { kind: 'page', key: 'preparing' };
    let resolveProjection = () => projection;
    const started = await startWith({
      pages: [{ key: 'preparing', bytes: PAGE }],
      resolve: () => resolveProjection(),
    });

    try {
      const thrown = new Error('caller-owned-secret');
      let getterCalls = 0;
      projection = Object.defineProperty({}, 'kind', {
        enumerable: true,
        get() {
          getterCalls++;
          throw thrown;
        },
      });
      const failed = await fetch(started.url);
      expect(failed.status).to.eql(500);
      expect(await failed.text()).to.eql(FAILURE_HTML);
      expect(Json.stringify([...failed.headers])).to.not.include(thrown.message);
      expect(getterCalls).to.eql(0);

      let proxyTraps = 0;
      projection = new Proxy(Object.freeze({ kind: 'page', key: 'preparing' }), {
        getPrototypeOf(target) {
          proxyTraps++;
          return Reflect.getPrototypeOf(target);
        },
        ownKeys(target) {
          proxyTraps++;
          return Reflect.ownKeys(target);
        },
      });
      const proxied = await fetch(started.url);
      expect(proxied.status).to.eql(500);
      await proxied.body?.cancel();
      expect(proxyTraps).to.eql(0);

      projection = Promise.resolve({ kind: 'page', key: 'preparing' });
      const asynchronous = await fetch(started.url);
      expect(asynchronous.status).to.eql(500);
      await asynchronous.body?.cancel();

      resolveProjection = () => Promise.reject(new Error('caller-owned-rejection'));
      const rejected = await fetch(started.url);
      expect(rejected.status).to.eql(500);
      await rejected.body?.cancel();
      resolveProjection = () => projection;

      for (const malformed of [{ kind: 'page' }, { kind: 'redirect' }]) {
        projection = malformed;
        const response = await fetch(started.url);
        expect(response.status).to.eql(500);
        await response.body?.cancel();
      }

      let extraReads = 0;
      projection = Object.defineProperty({ kind: 'page', key: 'preparing' }, 'inert', {
        enumerable: true,
        get() {
          extraReads++;
          return 'ignored';
        },
      });
      const extra = await fetch(started.url);
      expect(extra.status).to.eql(200);
      await extra.body?.cancel();
      expect(extraReads).to.eql(0);
    } finally {
      await started.close('test.cleanup');
    }
  });

  it('refuses equivalent default-port spellings as the same redirect origin', async () => {
    for (
      const [bootstrapOrigin, redirectOrigin] of [
        ['http://127.0.0.1:80', 'http://127.0.0.1'],
        ['http://127.0.0.1', 'http://127.0.0.1:80'],
        ['http://[::1]:80', 'http://[::1]'],
        ['http://[::1]', 'http://[::1]:80'],
      ]
    ) {
      const response = statusResponse(new Request('http://local.invalid/capability'), {
        pages: new Map([['preparing', PAGE]]),
        resolve: () => ({ kind: 'redirect', origin: redirectOrigin }),
        capabilityPath: '/capability',
        origin: bootstrapOrigin,
      });
      expect([bootstrapOrigin, redirectOrigin, response.status]).to.eql([
        bootstrapOrigin,
        redirectOrigin,
        500,
      ]);
      expect(response.headers.get('location')).to.eql(null);
      await response.body?.cancel();
    }
  });

  it('makes capabilities launch-scoped and stale paths inert', async () => {
    const first = await BootstrapStatus.start({
      pages: [{ key: 'ready', bytes: PAGE }],
      resolve: () => ({ kind: 'page', key: 'ready' }),
    });
    const stalePath = new URL(first.url).pathname;
    await first.close('test.rotate');

    const second = await BootstrapStatus.start({
      pages: [{ key: 'ready', bytes: PAGE }],
      resolve: () => ({ kind: 'page', key: 'ready' }),
    });
    try {
      expect(new URL(second.url).pathname).to.not.eql(stalePath);
      const stale = await fetch(`${new URL(second.url).origin}${stalePath}`);
      expect(stale.status).to.eql(404);
      await stale.body?.cancel();
      const current = await fetch(second.url);
      expect(current.status).to.eql(200);
      await current.body?.cancel();
    } finally {
      await second.close('test.cleanup');
    }
  });
});
