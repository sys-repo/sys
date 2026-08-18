import { describe, Err, expect, it, Json, Rx, type t, WebFixture } from '../../-test.ts';
import { INPUT_LIMITS, snapshotInput, snapshotProjection } from '../u/u.input.ts';
import { DEFAULT_DEPENDENCIES, type StartDependencies, startWith } from '../u/u.start.ts';
import { statusResponse } from '../u/u.response.ts';
import { BootstrapStatus } from '../mod.ts';

const encoder = new TextEncoder();
const PAGE = encoder.encode('<!doctype html><title>Preparing</title><p>Preparing</p>');
const NOT_FOUND_HTML =
  '<!doctype html><meta charset="utf-8"><title>Not Found</title><p>Not found.</p>';
const FAILURE_HTML =
  '<!doctype html><meta charset="utf-8"><title>Unavailable</title><p>Bootstrap status is unavailable.</p>';
type PublicStartOptionKey = 'pages' | 'resolve';
type HasExactPublicStartOptionKeys =
  Exclude<keyof t.BootstrapStatus.StartOptions, PublicStartOptionKey> extends never
    ? Exclude<PublicStartOptionKey, keyof t.BootstrapStatus.StartOptions> extends never ? true
    : false
    : false;
const HAS_EXACT_PUBLIC_START_OPTION_KEYS: HasExactPublicStartOptionKeys = true;

type PublicStartedKey =
  | 'url'
  | 'finished'
  | 'disposed'
  | 'close'
  | typeof Symbol.asyncDispose
  | typeof Symbol.dispose;
type HasExactPublicStartedKeys = Exclude<keyof t.BootstrapStatus.Started, PublicStartedKey> extends
  never ? Exclude<PublicStartedKey, keyof t.BootstrapStatus.Started> extends never ? true
  : false
  : false;
type StartedIsAsyncDisposable = t.BootstrapStatus.Started extends globalThis.AsyncDisposable ? true
  : false;
type DualProtocolStarted =
  & Omit<t.BootstrapStatus.Started, typeof Symbol.dispose>
  & globalThis.Disposable;
type StartedRejectsDualProtocol = DualProtocolStarted extends t.BootstrapStatus.Started ? false
  : true;
const HAS_EXACT_PUBLIC_STARTED_KEYS: HasExactPublicStartedKeys = true;
const STARTED_IS_ASYNC_DISPOSABLE: StartedIsAsyncDisposable = true;
const STARTED_REJECTS_DUAL_PROTOCOL: StartedRejectsDualProtocol = true;

const POLICY_HEADERS = {
  'cache-control': 'no-store',
  'content-security-policy':
    "default-src 'none'; base-uri 'none'; child-src 'none'; connect-src 'none'; font-src 'none'; form-action 'none'; frame-ancestors 'none'; frame-src 'none'; img-src 'none'; manifest-src 'none'; media-src 'none'; object-src 'none'; script-src 'none'; style-src 'unsafe-inline'; worker-src 'none'",
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
} as const;

describe('BootstrapStatus.start', () => {
  it('binds one launch-scoped capability and snapshots caller-owned pages', async () => {
    const bytes = PAGE.slice();
    const pages: t.BootstrapStatus.Page<string>[] = [{ key: 'preparing', bytes }];
    const input: t.BootstrapStatus.StartOptions<string> = {
      pages,
      resolve: () => ({ kind: 'page', key: 'preparing' }),
    };
    let internal: t.HttpServer.Started | undefined;
    const pending = startWith(input, {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        internal = DEFAULT_DEPENDENCIES.startHttp(...args);
        return internal;
      },
    });
    bytes.fill(0);
    pages[0]!.key = 'changed';
    pages.push({ key: 'later', bytes: encoder.encode('later') });
    input.resolve = () => ({ kind: 'page', key: 'later' });
    const started = await pending;
    if (!internal) throw new Error('Expected internal listener');

    try {
      const url = new URL(started.url);
      expect(url.origin).to.eql(internal.origin);
      expect(url.pathname).to.match(/^\/[0-9a-z]{48}$/);
      expect(url.search).to.eql('');
      expect(url.hash).to.eql('');
      expect(internal.status().urls).to.eql([{ href: `${url.origin}/` }]);
      expect(HAS_EXACT_PUBLIC_START_OPTION_KEYS).to.eql(true);
      expect(HAS_EXACT_PUBLIC_STARTED_KEYS).to.eql(true);
      expect(STARTED_IS_ASYNC_DISPOSABLE).to.eql(true);
      expect(STARTED_REJECTS_DUAL_PROTOCOL).to.eql(true);
      const asyncDisposable: globalThis.AsyncDisposable = started;
      expect(asyncDisposable).to.equal(started);
      expect(Reflect.ownKeys(started)).to.eql([
        'url',
        'finished',
        'disposed',
        'close',
        Symbol.asyncDispose,
      ]);
      expect(Object.isFrozen(started)).to.eql(true);
      expect(started).to.not.equal(internal);
      expect(
        ['app', 'server', 'signal', 'status', 'origin', 'port', 'dispose', 'dispose$'].some((key) =>
          key in started
        ),
      ).to.eql(false);
      expect(Symbol.asyncDispose in started).to.eql(true);
      expect(Symbol.dispose in started).to.eql(false);

      const get = await fetch(started.url);
      expect(get.status).to.eql(200);
      expect(await get.text()).to.eql(new TextDecoder().decode(PAGE));
      expect(get.headers.get('content-length')).to.eql(String(PAGE.byteLength));
      assertPolicy(get);

      const head = await fetch(started.url, { method: 'HEAD' });
      expect(head.status).to.eql(200);
      expect(await head.text()).to.eql('');
      expect(head.headers.get('content-length')).to.eql(String(PAGE.byteLength));
      assertPolicy(head);
    } finally {
      await started.close('test.cleanup');
    }
  });

  it('native await using closes the host and awaits listener settlement', async () => {
    let started: t.BootstrapStatus.Started | undefined;

    {
      await using host = await BootstrapStatus.start({
        pages: [{ key: 'preparing', bytes: PAGE }],
        resolve: () => ({ kind: 'page', key: 'preparing' }),
      });
      started = host;
      expect(host.disposed).to.eql(false);
    }

    if (!started) throw new Error('Expected BootstrapStatus host.');
    expect(started.disposed).to.eql(true);
    await started.finished;
  });

  it('adapts native disposal without admitting a close reason', async () => {
    const lowerReasons: unknown[] = [];
    const started = await startWith({
      pages: [{ key: 'preparing', bytes: PAGE }],
      resolve: () => ({ kind: 'page', key: 'preparing' }),
    }, {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
        const close = listener.close.bind(listener);
        Object.defineProperty(listener, 'close', {
          configurable: true,
          enumerable: true,
          value(reason?: unknown) {
            lowerReasons.push(reason);
            return close(reason);
          },
        });
        return listener;
      },
    });

    expect(started[Symbol.asyncDispose].length).to.eql(0);
    const disposing = Reflect.apply(
      started[Symbol.asyncDispose] as (...args: unknown[]) => Promise<void>,
      started,
      ['symbol-reason'],
    );
    const explicit = started.close('owner-reason');
    expect(disposing).to.equal(explicit);
    expect(started[Symbol.asyncDispose]()).to.equal(disposing);
    await disposing;
    await started.finished;
    expect(lowerReasons).to.eql([undefined]);
    expect(started.disposed).to.eql(true);
  });

  it('keeps disposal proof private from public finished-promise mutation', async () => {
    const started = await BootstrapStatus.start({
      pages: [{ key: 'preparing', bytes: PAGE }],
      resolve: () => ({ kind: 'page', key: 'preparing' }),
    });
    let constructorReads = 0;

    try {
      Object.defineProperty(started.finished, 'constructor', {
        configurable: true,
        get() {
          constructorReads += 1;
          throw new Error('public finished constructor invoked');
        },
      });
      await started[Symbol.asyncDispose]();
      expect({ constructorReads, disposed: started.disposed }).to.eql({
        constructorReads: 0,
        disposed: true,
      });
    } finally {
      Reflect.deleteProperty(started.finished, 'constructor');
      await started.close('test.cleanup');
      await started.finished;
    }
  });

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
      const accepted = await direct(app, '/a'.padEnd(49, 'a'), host);
      expect(accepted.status).to.eql(200);
      assertPolicy(accepted);
      await accepted.body?.cancel();

      const head = await direct(app, '/a'.padEnd(49, 'a'), host, {}, 'HEAD');
      expect(head.status).to.eql(200);
      expect(await head.text()).to.eql('');

      const unknown = await direct(app, '/missing', host);
      expect(unknown.status).to.eql(404);
      assertPolicy(unknown);
      expect(await unknown.text()).to.eql(NOT_FOUND_HTML);

      const query = await direct(app, `${new URL(started.url).pathname}?token=ignored`, host);
      expect(query.status).to.eql(404);
      await query.body?.cancel();

      const emptyQuery = await direct(app, `${new URL(started.url).pathname}?`, host);
      expect(emptyQuery.status).to.eql(404);
      await emptyQuery.body?.cancel();

      const encoded = await direct(app, `/%61${'a'.repeat(47)}`, host);
      expect(encoded.status).to.eql(404);
      await encoded.body?.cancel();

      const method = await direct(app, new URL(started.url).pathname, host, {}, 'POST');
      expect(method.status).to.eql(405);
      expect(method.headers.get('allow')).to.eql('GET, HEAD');
      await method.body?.cancel();

      const wrongHost = await direct(
        app,
        new URL(started.url).pathname,
        `localhost:${new URL(started.url).port}`,
      );
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
        const malformed = await direct(app, new URL(started.url).pathname, host, {
          'sec-fetch-site': site,
        });
        expect([site, malformed.status]).to.eql([site, 403]);
        await malformed.body?.cancel();
      }

      for (const site of ['same-origin', 'same-site', 'none']) {
        const response = await direct(app, new URL(started.url).pathname, host, {
          'sec-fetch-site': site,
        });
        expect([site, response.status]).to.eql([site, 200]);
        await response.body?.cancel();
      }
      expect(resolves).to.eql(5);
    } finally {
      await started.close('test.cleanup');
    }
  });

  it('redirects only to an exact numeric-loopback origin and sanitizes resolver failure', async () => {
    let projection: unknown = { kind: 'page', key: 'preparing' };
    let resolveProjection = () => projection;
    const started = await startWith({
      pages: [{ key: 'preparing', bytes: PAGE }],
      resolve: () => resolveProjection(),
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
        const redirected = await fetch(started.url, { redirect: 'manual' });
        expect([origin, redirected.status]).to.eql([origin, 303]);
        expect(redirected.headers.get('location')).to.eql(origin);
        expect(redirected.headers.get('content-length')).to.eql('0');
        assertPolicy(redirected);
        await redirected.body?.cancel();
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

      let projectionExtraReads = 0;
      projection = Object.defineProperty({ kind: 'page', key: 'preparing' }, 'inert', {
        enumerable: true,
        get() {
          projectionExtraReads++;
          return 'ignored';
        },
      });
      const projectionWithInertExtra = await fetch(started.url);
      expect(projectionWithInertExtra.status).to.eql(200);
      await projectionWithInertExtra.body?.cancel();
      expect(projectionExtraReads).to.eql(0);

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
    } finally {
      await started.close('test.cleanup');
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

  it('bounds all synchronous page copying before listener startup', async () => {
    expect(INPUT_LIMITS).to.eql({
      pages: 16,
      keyChars: 128,
      pageBytes: 256 * 1024,
      totalBytes: 1024 * 1024,
    });

    let starts = 0;
    const deps: StartDependencies = {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        starts++;
        return DEFAULT_DEPENDENCIES.startHttp(...args);
      },
    };
    const pageAtLimit = new Uint8Array(INPUT_LIMITS.pageBytes);
    const fixedShared = new Uint8Array(new SharedArrayBuffer(1));
    const growableShared = new Uint8Array(new SharedArrayBuffer(1, { maxByteLength: 8 }));
    const detached = new Uint8Array(1);
    structuredClone(detached.buffer, { transfer: [detached.buffer] });
    class Uint8ArraySubclass extends Uint8Array {}
    const subclassed = new Uint8ArraySubclass(1);
    const alteredPrototype = new Uint8Array(1);
    Object.setPrototypeOf(alteredPrototype, {});

    const inputs = [
      {
        pages: Array.from({ length: INPUT_LIMITS.pages + 1 }, (_, index) => ({
          key: `page-${index}`,
          bytes: PAGE,
        })),
        resolve: () => ({ kind: 'page', key: 'page-0' }),
      },
      {
        pages: [{ key: 'x'.repeat(INPUT_LIMITS.keyChars + 1), bytes: PAGE }],
        resolve: () => ({ kind: 'page', key: 'unused' }),
      },
      {
        pages: [{ key: 'oversized', bytes: new Uint8Array(INPUT_LIMITS.pageBytes + 1) }],
        resolve: () => ({ kind: 'page', key: 'oversized' }),
      },
      {
        pages: [
          ...Array.from(
            { length: INPUT_LIMITS.totalBytes / pageAtLimit.byteLength },
            (_, index) => ({ key: `aggregate-${index}`, bytes: pageAtLimit }),
          ),
          { key: 'aggregate-over', bytes: new Uint8Array(1) },
        ],
        resolve: () => ({ kind: 'page', key: 'aggregate-0' }),
      },
      ...[fixedShared, growableShared, detached, subclassed, alteredPrototype].map((
        bytes,
        index,
      ) => ({
        pages: [{ key: `invalid-bytes-${index}`, bytes }],
        resolve: () => ({ kind: 'page', key: `invalid-bytes-${index}` }),
      })),
    ];

    for (const input of inputs) {
      const error = await catchError(() => startWith(input, deps));
      expect(error?.message).to.eql('BootstrapStatus.start invalid input.');
    }
    expect(starts).to.eql(0);

    const resizable = new Uint8Array(new ArrayBuffer(1, { maxByteLength: 8 }));
    const boundaryInputs = [
      {
        pages: Array.from({ length: INPUT_LIMITS.pages }, (_, index) => ({
          key: `page-${index}`,
          bytes: new Uint8Array(),
        })),
        resolve: () => ({ kind: 'page', key: 'page-0' }),
      },
      {
        pages: [{ key: 'x'.repeat(INPUT_LIMITS.keyChars), bytes: pageAtLimit }],
        resolve: () => ({ kind: 'page', key: 'x'.repeat(INPUT_LIMITS.keyChars) }),
      },
      {
        pages: Array.from(
          { length: INPUT_LIMITS.totalBytes / pageAtLimit.byteLength },
          (_, index) => ({ key: `aggregate-${index}`, bytes: pageAtLimit }),
        ),
        resolve: () => ({ kind: 'page', key: 'aggregate-0' }),
      },
      {
        pages: [{ key: 'resizable', bytes: resizable }],
        resolve: () => ({ kind: 'page', key: 'resizable' }),
      },
    ];
    for (const input of boundaryInputs) {
      const started = await startWith(input, deps);
      await started.close('test.boundary');
    }
    expect(starts).to.eql(boundaryInputs.length);
  });

  it('ignores high-cardinality inert extras without enumerating their values', () => {
    let extraReads = 0;
    const page: Record<PropertyKey, unknown> = { key: 'ready', bytes: PAGE };
    const pages = [page];
    const input: Record<PropertyKey, unknown> = {
      pages,
      resolve: () => ({ kind: 'page', key: 'ready' }),
    };
    for (let index = 0; index < 20_000; index++) {
      input[`input-extra-${index}`] = index;
      page[`page-extra-${index}`] = index;
      Object.defineProperty(pages, `pages-extra-${index}`, {
        configurable: true,
        value: index,
      });
    }
    Object.defineProperty(input, 'inert-accessor', {
      enumerable: true,
      get() {
        extraReads++;
        return 'ignored';
      },
    });
    Object.defineProperty(page, 'inert-accessor', {
      enumerable: true,
      get() {
        extraReads++;
        return 'ignored';
      },
    });

    const prepared = snapshotInput(input);
    expect(prepared?.pages.size).to.eql(1);
    expect(prepared?.pages.get('ready')).to.eql(PAGE);
    expect(extraReads).to.eql(0);
  });

  it('uses captured reflection while snapshotting input and resolver projections', () => {
    const originalApply = Reflect.apply;
    const originalDescriptor = Object.getOwnPropertyDescriptor;
    const originalFreeze = Object.freeze;
    const originalPrototype = Object.getPrototypeOf;
    const attacks = [
      { target: Reflect, key: 'apply', value: originalApply },
      { target: Object, key: 'getOwnPropertyDescriptor', value: originalDescriptor },
      { target: Object, key: 'freeze', value: originalFreeze },
      { target: Object, key: 'getPrototypeOf', value: originalPrototype },
    ] as const;

    for (const attack of attacks) {
      let ambientCalls = 0;
      let prepared: ReturnType<typeof snapshotInput>;
      let projection: ReturnType<typeof snapshotProjection>;
      {
        using _mock = WebFixture.Property.mock([{
          target: attack.target,
          key: attack.key,
          descriptor: {
            configurable: true,
            value: (...args: unknown[]) => {
              ambientCalls += 1;
              return originalApply(attack.value, attack.target, args);
            },
          },
        }]);
        prepared = snapshotInput({
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
        });
        projection = snapshotProjection({ kind: 'page', key: 'ready' });
        expect(snapshotProjection(Promise.resolve({ kind: 'page', key: 'ready' }))).to.eql(
          undefined,
        );
      }
      expect({ key: attack.key, ambientCalls, pages: prepared?.pages.size, projection }).to.eql({
        key: attack.key,
        ambientCalls: 0,
        pages: 1,
        projection: { kind: 'page', key: 'ready' },
      });
    }
  });

  it('rejects malformed authority before listener startup and owns explicit close', async () => {
    let starts = 0;
    const deps: StartDependencies = {
      ...DEFAULT_DEPENDENCIES,
      capability: () => 'c'.repeat(48),
      startHttp(...args) {
        starts++;
        return DEFAULT_DEPENDENCIES.startHttp(...args);
      },
    };
    let inputProxyTraps = 0;
    const proxiedInput = new Proxy({
      pages: [{ key: 'ready', bytes: PAGE }],
      resolve: () => ({ kind: 'page', key: 'ready' }),
    }, {
      getPrototypeOf(target) {
        inputProxyTraps++;
        return Reflect.getPrototypeOf(target);
      },
      ownKeys(target) {
        inputProxyTraps++;
        return Reflect.ownKeys(target);
      },
    });
    let tagAccessorCalls = 0;
    const tagAccessorPage = { key: 'ready', bytes: PAGE };
    Object.defineProperty(tagAccessorPage, Symbol.toStringTag, {
      get() {
        tagAccessorCalls++;
        return 'Object';
      },
    });

    let requiredAccessorCalls = 0;
    const pagesAccessorInput = { resolve: () => ({ kind: 'page', key: 'ready' }) };
    Object.defineProperty(pagesAccessorInput, 'pages', {
      enumerable: true,
      get() {
        requiredAccessorCalls++;
        return [{ key: 'ready', bytes: PAGE }];
      },
    });
    const resolveAccessorInput = { pages: [{ key: 'ready', bytes: PAGE }] };
    Object.defineProperty(resolveAccessorInput, 'resolve', {
      enumerable: true,
      get() {
        requiredAccessorCalls++;
        return () => ({ kind: 'page', key: 'ready' });
      },
    });
    const indexAccessorPages: unknown[] = [];
    Object.defineProperty(indexAccessorPages, '0', {
      enumerable: true,
      get() {
        requiredAccessorCalls++;
        return { key: 'ready', bytes: PAGE };
      },
    });
    const keyAccessorPage = { bytes: PAGE };
    Object.defineProperty(keyAccessorPage, 'key', {
      enumerable: true,
      get() {
        requiredAccessorCalls++;
        return 'ready';
      },
    });
    const bytesAccessorPage = { key: 'ready' };
    Object.defineProperty(bytesAccessorPage, 'bytes', {
      enumerable: true,
      get() {
        requiredAccessorCalls++;
        return PAGE;
      },
    });

    let nestedProxyTraps = 0;
    const nestedHandler: ProxyHandler<object> = {
      get() {
        nestedProxyTraps++;
        throw new Error('nested proxy get trap');
      },
      getPrototypeOf() {
        nestedProxyTraps++;
        throw new Error('nested proxy prototype trap');
      },
      ownKeys() {
        nestedProxyTraps++;
        throw new Error('nested proxy keys trap');
      },
    };
    const pagesProxy = new Proxy([{ key: 'ready', bytes: PAGE }], nestedHandler);
    const revokedPages = Proxy.revocable([{ key: 'ready', bytes: PAGE }], nestedHandler);
    revokedPages.revoke();
    const pageProxy = new Proxy({ key: 'ready', bytes: PAGE }, nestedHandler);
    const bytesProxy = new Proxy(PAGE.slice(), nestedHandler);
    const resolverProxy = new Proxy(() => ({ kind: 'page', key: 'ready' }), {
      apply() {
        nestedProxyTraps++;
        throw new Error('resolver proxy apply trap');
      },
      getPrototypeOf() {
        nestedProxyTraps++;
        throw new Error('resolver proxy prototype trap');
      },
    });

    let untilProxyTraps = 0;
    const untilProxy = new Proxy(new AbortController().signal, {
      get() {
        untilProxyTraps++;
        throw new Error('until proxy get trap');
      },
      getPrototypeOf() {
        untilProxyTraps++;
        throw new Error('until proxy prototype trap');
      },
      ownKeys() {
        untilProxyTraps++;
        throw new Error('until proxy keys trap');
      },
    });
    const observingUntilHandler: ProxyHandler<object> = {
      get(target, key, receiver) {
        untilProxyTraps++;
        return Reflect.get(target, key, receiver);
      },
      getPrototypeOf(target) {
        untilProxyTraps++;
        return Reflect.getPrototypeOf(target);
      },
      ownKeys(target) {
        untilProxyTraps++;
        return Reflect.ownKeys(target);
      },
    };
    const transparentUntil = new Proxy({}, observingUntilHandler);
    const invariantUntil = new Proxy(Object.freeze({ kind: 'until' }), observingUntilHandler);
    const revokedUntil = Proxy.revocable({}, observingUntilHandler);
    revokedUntil.revoke();
    let untilAccessorCalls = 0;
    const untilAccessor = Object.create(AbortSignal.prototype);
    Object.defineProperty(untilAccessor, 'aborted', {
      enumerable: true,
      get() {
        untilAccessorCalls++;
        return false;
      },
    });
    const untilDuck = {};
    Object.defineProperties(untilDuck, {
      disposed: {
        enumerable: true,
        get() {
          untilAccessorCalls++;
          return false;
        },
      },
      dispose$: {
        enumerable: true,
        get() {
          untilAccessorCalls++;
          return undefined;
        },
      },
    });
    const topUntilAccessor = {
      pages: [{ key: 'ready', bytes: PAGE }],
      resolve: () => ({ kind: 'page', key: 'ready' }),
    };
    Object.defineProperty(topUntilAccessor, 'until', {
      enumerable: true,
      get() {
        untilAccessorCalls++;
        return new AbortController().signal;
      },
    });
    const observedSignal = new AbortController().signal;
    const observer = () => undefined;
    observedSignal.addEventListener('abort', observer);
    observedSignal.removeEventListener('abort', observer);
    const nativeSignal = new AbortController().signal;
    const forgedSignal = Object.create(
      AbortSignal.prototype,
      Object.getOwnPropertyDescriptors(nativeSignal),
    );
    let untilSubscriptions = 0;
    let untilCallbacks = 0;
    const untilObservable = new Rx.Observable<void>((subscriber) => {
      untilSubscriptions++;
      subscriber.next();
      untilCallbacks++;
    });
    const untilSubject = new Rx.Subject<void>();
    const subscribeSubject = untilSubject.subscribe.bind(untilSubject);
    Object.defineProperty(untilSubject, 'subscribe', {
      value: (...args: unknown[]) => {
        untilSubscriptions++;
        const subscription = Reflect.apply(subscribeSubject, untilSubject, args);
        untilSubject.next();
        untilCallbacks++;
        return subscription;
      },
    });

    for (
      const input of [
        proxiedInput,
        null,
        {},
        pagesAccessorInput,
        resolveAccessorInput,
        {
          pages: indexAccessorPages,
          resolve: () => ({ kind: 'page', key: 'ready' }),
        },
        {
          pages: [keyAccessorPage],
          resolve: () => ({ kind: 'page', key: 'ready' }),
        },
        {
          pages: [bytesAccessorPage],
          resolve: () => ({ kind: 'page', key: 'ready' }),
        },
        { pages: [], resolve: () => ({ kind: 'page', key: 'ready' }) },
        {
          pages: [{ key: 'same', bytes: PAGE }, { key: 'same', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'same' }),
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          token: 'caller-selected',
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          capability: 'caller-selected',
        },
        {
          pages: pagesProxy,
          resolve: () => ({ kind: 'page', key: 'ready' }),
        },
        {
          pages: revokedPages.proxy,
          resolve: () => ({ kind: 'page', key: 'ready' }),
        },
        {
          pages: [pageProxy],
          resolve: () => ({ kind: 'page', key: 'ready' }),
        },
        {
          pages: [{ key: 'ready', bytes: bytesProxy }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: resolverProxy,
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: untilProxy,
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: transparentUntil,
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: invariantUntil,
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: revokedUntil.proxy,
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: untilAccessor,
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: untilDuck,
        },
        topUntilAccessor,
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: undefined,
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: [],
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: untilObservable,
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: untilSubject,
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: nativeSignal,
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: observedSignal,
        },
        {
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
          until: forgedSignal,
        },
      ]
    ) {
      const error = await catchError(() => startWith(input, deps));
      expect(error?.message).to.eql('BootstrapStatus.start invalid input.');
    }
    expect(
      snapshotInput({
        pages: [tagAccessorPage],
        resolve: () => ({ kind: 'page', key: 'ready' }),
      })?.pages.size,
    ).to.eql(1);

    expect({
      starts,
      inputProxyTraps,
      tagAccessorCalls,
      requiredAccessorCalls,
      nestedProxyTraps,
      untilProxyTraps,
      untilAccessorCalls,
      untilSubscriptions,
      untilCallbacks,
    }).to.eql({
      starts: 0,
      inputProxyTraps: 0,
      tagAccessorCalls: 0,
      requiredAccessorCalls: 0,
      nestedProxyTraps: 0,
      untilProxyTraps: 0,
      untilAccessorCalls: 0,
      untilSubscriptions: 0,
      untilCallbacks: 0,
    });

    const invalidCapability = await catchError(() =>
      startWith({
        pages: [{ key: 'ready', bytes: PAGE }],
        resolve: () => ({ kind: 'page', key: 'ready' }),
      }, {
        ...deps,
        capability: () => 'caller-selected',
      })
    );
    expect(invalidCapability?.message).to.eql('BootstrapStatus.start failed.');
    expect(starts).to.eql(0);

    let capabilityCoercions = 0;
    const hostileCapability = {
      [Symbol.toPrimitive]() {
        capabilityCoercions += 1;
        throw new Error('capability coercion invoked');
      },
    };
    const hostileCapabilityFailure = await catchError(() =>
      startWith({
        pages: [{ key: 'ready', bytes: PAGE }],
        resolve: () => ({ kind: 'page', key: 'ready' }),
      }, {
        ...deps,
        capability: () => hostileCapability as unknown as string,
      })
    );
    expect(hostileCapabilityFailure?.message).to.eql('BootstrapStatus.start failed.');
    expect({ starts, capabilityCoercions }).to.eql({ starts: 0, capabilityCoercions: 0 });

    let speciesReads = 0;
    let poisonedStarts = 0;
    const poisonedStartup = startWith({
      pages: [{ key: 'ready', bytes: PAGE }],
      resolve: () => ({ kind: 'page', key: 'ready' }),
    }, {
      ...deps,
      startHttp(...args) {
        poisonedStarts++;
        return DEFAULT_DEPENDENCIES.startHttp(...args);
      },
    });
    let poisonedFailure: Error | undefined;
    {
      using _mock = WebFixture.Property.mock([{
        target: Promise,
        key: Symbol.species,
        descriptor: {
          configurable: true,
          get() {
            speciesReads++;
            throw new Error('Promise species accessor invoked');
          },
        },
      }]);
      poisonedFailure = await catchError(() => poisonedStartup);
    }
    expect(poisonedFailure?.message).to.eql('BootstrapStatus.start failed.');
    expect({ poisonedStarts, speciesReads }).to.eql({ poisonedStarts: 0, speciesReads: 0 });

    let bindAttempts = 0;
    const bindFailure = await catchError(() =>
      startWith({
        pages: [{ key: 'ready', bytes: PAGE }],
        resolve: () => ({ kind: 'page', key: 'ready' }),
      }, {
        ...deps,
        startHttp() {
          bindAttempts++;
          throw new Error('raw-bind-failure');
        },
      })
    );
    expect([bindAttempts, bindFailure?.message]).to.eql([
      1,
      'BootstrapStatus.start failed.',
    ]);

    let stoppedDuringStartup: t.HttpServer.Started | undefined;
    let stoppedDuringStartupFinished: Promise<void> | undefined;
    let startupCloseCalls = 0;
    const immediateDeath = await catchError(() =>
      startWith({
        pages: [{ key: 'ready', bytes: PAGE }],
        resolve: () => ({ kind: 'page', key: 'ready' }),
      }, {
        ...deps,
        startHttp(...args) {
          const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
          const close = listener.close.bind(listener);
          stoppedDuringStartupFinished = listener.finished;
          Object.defineProperty(listener, 'finished', {
            configurable: true,
            value: Promise.resolve(),
          });
          Object.defineProperty(listener, 'close', {
            value: (reason?: unknown) => {
              startupCloseCalls++;
              return close(reason);
            },
          });
          stoppedDuringStartup = listener;
          void listener.close('test.immediate-death');
          return listener;
        },
      })
    );
    expect(immediateDeath?.message).to.eql('BootstrapStatus.start failed.');
    await stoppedDuringStartup?.finished;
    await stoppedDuringStartupFinished;
    expect(startupCloseCalls).to.eql(2);

    const raced = await BootstrapStatus.start({
      pages: [{ key: 'ready', bytes: PAGE }],
      resolve: () => ({ kind: 'page', key: 'ready' }),
    });
    const close1 = raced[Symbol.asyncDispose]();
    const close2 = raced.close('test.race-2');
    expect(close1).to.equal(close2);
    await Promise.all([close1, close2]);
    await raced.finished;
    expect(raced.disposed).to.eql(true);
  });

  it('rolls back a listener when its start dependency poisons Promise after bind', async () => {
    const speciesDescriptor = Object.getOwnPropertyDescriptor(Promise, Symbol.species);
    if (!speciesDescriptor) throw new Error('Expected Promise species descriptor.');
    let internalFinished: Promise<void> | undefined;
    let starts = 0;
    let closeCalls = 0;
    let speciesReads = 0;
    let failure: unknown;

    try {
      failure = await catchCause(() =>
        startWith({
          pages: [{ key: 'ready', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'ready' }),
        }, {
          ...DEFAULT_DEPENDENCIES,
          startHttp(...args) {
            starts += 1;
            const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
            internalFinished = listener.finished;
            const close = listener.close.bind(listener);
            Object.defineProperty(listener, 'close', {
              configurable: true,
              enumerable: true,
              value: (reason?: unknown) => {
                closeCalls += 1;
                return close(reason);
              },
            });
            Object.defineProperty(Promise, Symbol.species, {
              configurable: true,
              get() {
                speciesReads += 1;
                throw new Error('Promise species accessor invoked');
              },
            });
            return listener;
          },
        })
      );
    } finally {
      Object.defineProperty(Promise, Symbol.species, speciesDescriptor);
    }

    if (!internalFinished) throw new Error('Expected internal listener completion.');
    await internalFinished;
    expect(failure).to.be.instanceOf(Error);
    expect((failure as Error).message).to.eql('BootstrapStatus.start failed.');
    expect({ starts, closeCalls, speciesReads }).to.eql({
      starts: 1,
      closeCalls: 1,
      speciesReads: 0,
    });
  });

  it('retains an unobservable rollback operation without retrying it', async () => {
    const operation = Promise.withResolvers<void>();
    let constructorReads = 0;
    Object.defineProperty(operation.promise, 'constructor', {
      configurable: true,
      get() {
        constructorReads += 1;
        throw new Error('rollback constructor invoked');
      },
    });
    let listener: t.HttpServer.Started | undefined;
    let originalShutdown: (() => Promise<void>) | undefined;
    let closeCalls = 0;
    let shutdownCalls = 0;

    const failure = await catchCause(() =>
      startWith({
        pages: [{ key: 'ready', bytes: PAGE }],
        resolve: () => ({ kind: 'page', key: 'ready' }),
      }, {
        ...DEFAULT_DEPENDENCIES,
        startHttp(...args) {
          listener = DEFAULT_DEPENDENCIES.startHttp(...args);
          originalShutdown = listener.server.shutdown.bind(listener.server);
          Object.defineProperties(listener, {
            origin: {
              configurable: true,
              enumerable: true,
              value: 'not-an-origin',
            },
            close: {
              configurable: true,
              enumerable: true,
              value: () => {
                closeCalls += 1;
                return operation.promise;
              },
            },
          });
          Object.defineProperty(listener.server, 'shutdown', {
            configurable: true,
            value: () => {
              shutdownCalls += 1;
              return operation.promise;
            },
          });
          return listener;
        },
      })
    );

    expect(failure).to.be.instanceOf(Error);
    expect((failure as Error).message).to.eql('BootstrapStatus.start failed.');
    expect({ closeCalls, shutdownCalls, constructorReads }).to.eql({
      closeCalls: 1,
      shutdownCalls: 1,
      constructorReads: 0,
    });

    if (!listener || !originalShutdown) throw new Error('Expected retained lower listener.');
    Reflect.deleteProperty(listener.server, 'shutdown');
    await originalShutdown();
    await listener.finished;
    operation.resolve();
  });

  it('sanitizes lower finished rejection only after real listener termination', async () => {
    const delayedFinished = Promise.withResolvers<void>();
    let internal: t.HttpServer.Started | undefined;
    let actualFinished: Promise<void> | undefined;
    let rawFailure: Readonly<{ server: Deno.HttpServer<Deno.NetAddr> }> | undefined;
    const started = await startWith({
      pages: [{ key: 'ready', bytes: PAGE }],
      resolve: () => ({ kind: 'page', key: 'ready' }),
    }, {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
        internal = listener;
        actualFinished = listener.finished;
        rawFailure = Object.freeze({ server: listener.server });
        Object.defineProperties(listener, {
          finished: { configurable: true, value: delayedFinished.promise },
          disposed: {
            configurable: true,
            get() {
              throw rawFailure;
            },
          },
        });
        return listener;
      },
    });
    if (!internal || !actualFinished || !rawFailure) throw new Error('Expected internal listener');

    let disposing: Promise<void> | undefined;
    try {
      expect(started.disposed).to.eql(false);
      disposing = started[Symbol.asyncDispose]();
      await actualFinished;
      const reachabilityFailure = await catchCause(() => fetch(started.url));
      expect(reachabilityFailure).to.be.instanceOf(Error);
      expect(started.disposed).to.eql(false);

      delayedFinished.reject(rawFailure);
      const disposalFailure = await catchCause(() => disposing!);
      assertLifecycleFailure(disposalFailure, rawFailure);
      const finishedFailure = await catchCause(() => started.finished);
      assertLifecycleFailure(finishedFailure, rawFailure);
      expect(started.disposed).to.eql(true);
    } finally {
      delayedFinished.reject(rawFailure);
      await internal.close('test.lifecycle-finished.cleanup');
      await actualFinished;
      if (disposing) await catchCause(() => disposing);
    }
  });

  it('sanitizes close failure, retries shutdown, and memoizes completion', async () => {
    let shutdownCalls = 0;
    let rawFailure: Readonly<{ server: Deno.HttpServer<Deno.NetAddr> }> | undefined;
    const started = await startWith({
      pages: [{ key: 'ready', bytes: PAGE }],
      resolve: () => ({ kind: 'page', key: 'ready' }),
    }, {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
        const shutdown = listener.server.shutdown.bind(listener.server);
        rawFailure = Object.freeze({ server: listener.server });
        Object.defineProperty(listener.server, 'shutdown', {
          configurable: true,
          value: () => {
            shutdownCalls++;
            return shutdownCalls === 1 ? Promise.reject(rawFailure) : shutdown();
          },
        });
        Object.defineProperty(listener, 'disposed', {
          configurable: true,
          get() {
            throw rawFailure;
          },
        });
        return listener;
      },
    });
    if (!rawFailure) throw new Error('Expected raw lifecycle failure');

    expect(started.disposed).to.eql(false);
    const close1 = started.close('test.lifecycle-close');
    const close2 = started.close('test.lifecycle-close-again');
    expect(close1).to.equal(close2);
    const failure = await catchCause(() => close1);
    assertLifecycleFailure(failure, rawFailure);
    expect(started.close('test.lifecycle-close-settled')).to.equal(close1);
    await started.finished;
    expect(started.disposed).to.eql(true);
    expect(shutdownCalls).to.eql(2);
  });

  it('reports delayed lower close rejection after listener finish', async () => {
    let rawFailure: Readonly<{ server: Deno.HttpServer<Deno.NetAddr> }> | undefined;
    const started = await startWith({
      pages: [{ key: 'ready', bytes: PAGE }],
      resolve: () => ({ kind: 'page', key: 'ready' }),
    }, {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
        const finished = listener.finished;
        rawFailure = Object.freeze({ server: listener.server });
        Object.defineProperty(listener, 'close', {
          configurable: true,
          async value() {
            await listener.server.shutdown();
            await finished;
            throw rawFailure;
          },
        });
        return listener;
      },
    });
    if (!rawFailure) throw new Error('Expected delayed close failure');

    const close1 = started.close('test.delayed-close-failure');
    const close2 = started.close('test.delayed-close-failure-again');
    expect(close1).to.equal(close2);
    const failure = await catchCause(() => close1);
    assertLifecycleFailure(failure, rawFailure);
    expect(started.close('test.delayed-close-failure-settled')).to.equal(close1);
    await started.finished;
    expect(started.disposed).to.eql(true);
  });

  it('retains rollback authority until rejected shutdown terminates', async () => {
    let internalFinished: Promise<void> | undefined;
    let listenerOrigin: string | undefined;
    let rollbackCloseCalls = 0;
    let shutdownCalls = 0;
    const rawFailure = Object.freeze({ kind: 'raw-shutdown-failure' });

    const failure = await catchCause(() =>
      startWith({
        pages: [{ key: 'ready', bytes: PAGE }],
        resolve: () => ({ kind: 'page', key: 'ready' }),
      }, {
        ...DEFAULT_DEPENDENCIES,
        startHttp(...args) {
          const listener = DEFAULT_DEPENDENCIES.startHttp(...args);
          internalFinished = listener.finished;
          listenerOrigin = listener.origin;
          const close = listener.close.bind(listener);
          const shutdown = listener.server.shutdown.bind(listener.server);
          Object.defineProperty(listener, 'close', {
            configurable: true,
            value: (reason?: unknown) => {
              rollbackCloseCalls++;
              return close(reason);
            },
          });
          Object.defineProperty(listener.server, 'shutdown', {
            configurable: true,
            value: () => {
              shutdownCalls++;
              return shutdownCalls === 1 ? Promise.reject(rawFailure) : shutdown();
            },
          });
          Object.defineProperty(listener, 'origin', {
            configurable: true,
            value: 'not-an-origin',
          });
          return listener;
        },
      })
    );

    expect(failure).to.be.instanceOf(Error);
    expect((failure as Error).message).to.eql('BootstrapStatus.start failed.');
    expect(failure).to.not.equal(rawFailure);
    expect('cause' in (failure as object)).to.eql(false);
    expect([rollbackCloseCalls, shutdownCalls]).to.eql([1, 2]);
    if (!internalFinished || !listenerOrigin) throw new Error('Expected rollback listener');
    await internalFinished;
    const reachabilityFailure = await catchCause(() => fetch(listenerOrigin!));
    expect(reachabilityFailure).to.be.instanceOf(Error);
  });
});

async function deterministicStart<K extends string>(
  input: t.BootstrapStatus.StartOptions<K>,
  character: string,
): Promise<Readonly<{ started: t.BootstrapStatus.Started; app: t.HttpServer.App }>> {
  let app: t.HttpServer.App | undefined;
  const started = await startWith(input, {
    ...DEFAULT_DEPENDENCIES,
    capability: () => character.repeat(48),
    createApp(...args) {
      app = DEFAULT_DEPENDENCIES.createApp(...args);
      return app;
    },
  });
  if (!app) throw new Error('Expected internal application');
  return { started, app };
}

function direct(
  app: t.HttpServer.App,
  path: string,
  host: string,
  headers: Record<string, string> = {},
  method = 'GET',
): Promise<Response> {
  return Promise.resolve(app.request(
    new Request(`http://local.invalid${path}`, {
      method,
      headers: { host, ...headers },
    }),
  ));
}

function hostOf(started: t.BootstrapStatus.Started): string {
  return new URL(started.url).host;
}

function assertPolicy(response: Response): void {
  for (const [name, value] of Object.entries(POLICY_HEADERS)) {
    expect([response.status, name, response.headers.get(name)]).to.eql([
      response.status,
      name,
      value,
    ]);
  }
  expect(response.headers.get('content-type')).to.eql('text/html; charset=UTF-8');
}

function assertLifecycleFailure(input: unknown, raw: unknown): void {
  expect(input).to.be.instanceOf(Error);
  expect((input as Error).message).to.eql('BootstrapStatus listener lifecycle failed.');
  expect(input).to.not.equal(raw);
  expect('cause' in (input as object)).to.eql(false);
}

async function catchError(fn: () => unknown | Promise<unknown>): Promise<Error | undefined> {
  const cause = await catchCause(fn);
  return cause === undefined ? undefined : Err.normalize(cause);
}

async function catchCause(fn: () => unknown | Promise<unknown>): Promise<unknown> {
  try {
    await fn();
  } catch (cause) {
    return cause;
  }
}
