import { Hash } from '@sys/crypto/hash';
import { Pkg } from '@sys/std/pkg';
import { describe, expect, expectTypeOf, it, Json, type t, Time, WebFixture } from '../../-test.ts';
import { R2 } from '../mod.ts';
import { fixture } from './u.fixture.fromDist.ts';
import { expectResponsePolicy, forbidFetch, origin, request } from './u.fixture.readRoute.ts';

const fromDist = (args: t.R2.ReadRoute.FromDist.Args) => R2.ReadRoute.fromDist(args);

describe('R2.ReadRoute.fromDist', () => {
  it('admits once before policy, then serves authorized requests without a bootstrap byte cache', async () => {
    const f = fixture();
    let fetched = 0;
    using _fetch = WebFixture.Fetch.mock(() => {
      fetched++;
      return Promise.resolve(new Response(fetched === 1 ? f.bytes : 'hello'));
    });
    const result = await fromDist(f.args);
    expectTypeOf(result).toEqualTypeOf<t.R2.ReadRoute.FromDist.Result>();
    expect(Object.isFrozen(result)).to.eql(true);
    expect(result.kind).to.eql('ready');
    if (result.kind !== 'ready') {
      // @ts-expect-error Refusals never expose a handler.
      expect(result.handler).to.eql(undefined);
      throw new Error('Expected handler.');
    }
    expectTypeOf(result.handler).toEqualTypeOf<t.R2.ReadRoute.Handler>();
    expect(f.signed).to.eql(['release/dist.json']);
    expect(f.authorized).to.eql([]);
    expect(f.policies.length).to.eql(1);
    expect(Object.isFrozen(f.policies[0].parts)).to.eql(true);
    expect(Object.keys(f.policies[0]).toSorted()).to.eql(['digest', 'parts', 'scheme']);
    for (const [path, method] of [['/', 'GET'], ['/index.html', 'HEAD'], ['/dist.json', 'GET']]) {
      const response = await result.handler(request(path, { method }));
      expect(response.status).to.eql(200);
      expect(await response.text()).to.eql(method === 'HEAD' ? '' : 'hello');
      expectResponsePolicy(response);
    }
    expect(f.authorized).to.eql(['release/index.html', 'release/index.html', 'release/dist.json']);
    expect(fetched).to.eql(4);
  });

  it('does not expose private constructor or handler state as a callback receiver', async () => {
    const f = fixture();
    const receivers: unknown[] = [];
    f.args.routes = function (this: unknown) {
      receivers.push(this);
      return { '/': 'index.html' };
    };
    f.args.authorize = function (this: unknown) {
      receivers.push(this);
      return false;
    };
    using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(new Response(f.bytes)));
    const result = await fromDist(f.args);
    if (result.kind !== 'ready') throw new Error('Expected handler.');
    expect((await result.handler(request('/'))).status).to.eql(403);
    expect(receivers).to.eql([undefined, undefined]);
    expect(f.signed).to.eql(['release/dist.json']);
  });

  it('refuses invalid input before storage or callbacks, even with a pre-aborted signal', async () => {
    const f = fixture();
    const caller = new AbortController();
    caller.abort();
    const invalid: unknown[] = [
      undefined,
      null,
      {},
      { ...f.args, pin: { 'dist.json': Hash.sha256(f.bytes) } },
      { ...f.args, integrity: Hash.sha256(f.bytes) },
      { ...f.args, pin: { ...f.args.pin, 'dist.json': Hash.sha256(f.bytes) } },
      { ...f.args, pin: { ...f.args.pin, scheme: 'sys.dist/v1' } },
      { ...f.args, pin: new Proxy(f.args.pin, {}) },
      { ...f.args, prefix: '../x' },
      { ...f.args, prefix: 'x/' },
      { ...f.args, prefix: undefined },
      { ...f.args, storageOrigin: 'https://public.example' },
      { ...f.args, bucket: { name: 'assets' } },
      { ...f.args, authorize: undefined },
      { ...f.args, routes: undefined },
      { ...f.args, signal: {} },
      { ...f.args, signal: new Proxy(new AbortController().signal, {}) },
    ];
    for (const field of ['manifestBytes', 'entries', 'fileBytes', 'totalBytes'] as const) {
      invalid.push({ ...f.args, manifestLimits: { ...f.args.manifestLimits, [field]: -1 } });
    }
    for (const field of ['maxBytes', 'timeout', 'maxConcurrent'] as const) {
      invalid.push({ ...f.args, limits: { ...f.args.limits, [field]: 0 } });
    }
    invalid.push({ ...f.args, prefix: '../x', signal: caller.signal });
    using fetch = forbidFetch();
    for (const args of invalid) {
      expect(await fromDist(args as t.R2.ReadRoute.FromDist.Args)).to.eql({
        kind: 'invalid-input',
      });
    }
    expect(await fromDist({ ...f.args, signal: caller.signal })).to.eql({ kind: 'cancelled' });
    expect(fetch.calls).to.eql(0);
    expect(f.signed).to.eql([]);
    expect(f.authorized).to.eql([]);
    expect(f.policies).to.eql([]);
  });

  it('non-native signals → invalid-input before signing or lifecycle hooks', async () => {
    let invoked = 0;
    const fail = () => {
      invoked++;
      throw new Error('signal-SECRET');
    };
    const signals: readonly unknown[] = [
      { aborted: false, addEventListener() {}, removeEventListener: fail },
      { aborted: false, addEventListener: fail, removeEventListener() {} },
      { aborted: true, addEventListener() {}, removeEventListener: fail },
      {
        aborted: false,
        get addEventListener() {
          return fail();
        },
        removeEventListener() {},
      },
      {
        aborted: false,
        addEventListener() {},
        get removeEventListener() {
          return fail();
        },
      },
      Object.create(AbortSignal.prototype),
      new EventTarget(),
    ];
    using fetch = forbidFetch();
    for (const signal of signals) {
      const f = fixture();
      f.args.signal = signal as AbortSignal;
      f.args.bucket.presignGet = (key) => {
        f.signed.push(key);
        return Promise.reject(new Error('signer-SECRET'));
      };
      const result = await fromDist(f.args);
      expect(result).to.eql({ kind: 'invalid-input' });
      expect(Object.isFrozen(result)).to.eql(true);
      expect(f.signed).to.eql([]);
      expect(f.authorized).to.eql([]);
      expect(f.policies).to.eql([]);
    }
    expect(fetch.calls).to.eql(0);
    expect(invoked).to.eql(0);
  });

  it('captures authority, budgets, callbacks, and the policy map across signer mutation', async () => {
    const f = fixture();
    const map = { '/': 'index.html' };
    const original = f.args.bucket;
    const caller = new AbortController();
    f.args.signal = caller.signal;
    const events: string[] = [];
    f.args.routes = () => map;
    f.args.authorize = () => {
      events.push('authorize');
      return true;
    };
    f.args.bucket.presignGet = function (key, options) {
      expect(this).to.equal(original);
      expect(options?.expirySeconds).to.eql(1);
      events.push(key);
      f.args.prefix = 'changed';
      f.args.storageOrigin = 'https://elsewhere.example';
      f.args.pin = { scheme: 'sys.dist/v2', digest: Hash.sha256('other') };
      f.args.manifestLimits.manifestBytes = 1;
      f.args.limits.maxBytes = 1;
      f.args.limits.timeout = 1;
      f.args.bucket = { name: 'other' };
      f.args.routes = () => {
        throw new Error('Replaced policy');
      };
      f.args.authorize = () => false;
      original.presignGet = () => {
        throw new Error('Replaced signer');
      };
      for (const name of ['addEventListener', 'removeEventListener']) {
        Object.defineProperty(caller.signal, name, {
          configurable: true,
          get() {
            throw new Error('Replaced signal method');
          },
        });
      }
      return Promise.resolve(`${origin}/assets/${key}`);
    };
    let fetched = 0;
    using _fetch = WebFixture.Fetch.mock(() =>
      Promise.resolve(new Response(++fetched === 1 ? f.bytes : 'hello'))
    );
    const result = await fromDist(f.args);
    expect(result.kind).to.eql('ready');
    if (result.kind !== 'ready') throw new Error('Expected handler.');
    map['/'] = 'other.html';
    const response = await result.handler(request('/'));
    expect(response.status).to.eql(200);
    expect(await response.text()).to.eql('hello');
    expect(events).to.eql(['release/dist.json', 'authorize', 'release/index.html']);
  });

  it('maps acquisition failures without exposing provider details or running policy', async () => {
    const cases = [
      { response: () => new Response('SECRET', { status: 404 }), status: 404 },
      { response: () => new Response('SECRET', { status: 403 }), status: 502 },
      {
        response: () =>
          new Response(null, { status: 302, headers: { location: 'https://secret.example' } }),
        status: 502,
      },
      {
        response: () => new Response('SECRET', { headers: { 'content-range': 'bytes 0-5/6' } }),
        status: 502,
      },
      {
        response: () => new Response('SECRET', { headers: { 'content-encoding': 'unknown' } }),
        status: 502,
      },
      { response: () => new Response(new Uint8Array(2048)), status: 413 },
      {
        response: () => {
          throw new Error('SECRET');
        },
        status: 502,
      },
    ];
    for (const item of cases) {
      const f = fixture();
      using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(item.response()));
      expect(await fromDist(f.args)).to.eql({ kind: 'read-refused', status: item.status });
      expect(f.policies).to.eql([]);
    }
    using fetch = forbidFetch();
    for (
      const sign of [
        () => Promise.resolve(`${origin}/other/dist.json?SECRET`),
        () => Promise.reject(new Error('SECRET')),
      ]
    ) {
      const f = fixture();
      f.args.bucket.presignGet = sign;
      expect(await fromDist(f.args)).to.eql({ kind: 'read-refused', status: 502 });
      expect(f.policies).to.eql([]);
    }
    expect(fetch.calls).to.eql(0);
  });

  it('preserves Dist refusal reasons and never invokes policy on refused bytes', async () => {
    for (
      const reason of ['pin-mismatch', 'malformed', 'unsafe-path', 'limit-exceeded'] as const
    ) {
      const f = fixture();
      if (reason === 'malformed') f.dist.hash.digest = Hash.sha256('forged');
      if (reason === 'unsafe-path') {
        f.args.manifestLimits.entries = 8;
        f.dist.hash.parts['../index.html'] = f.dist.hash.parts['index.html'];
        delete f.dist.hash.parts['index.html'];
        f.dist.hash.digest = Hash.sha256(Pkg.Dist.Content.encode(f.dist.hash.parts));
      }
      const bytes = new TextEncoder().encode(Json.stringify(f.dist, 0));
      f.args.manifestLimits.manifestBytes = bytes.length;
      f.args.pin = {
        scheme: 'sys.dist/v2',
        digest: reason === 'pin-mismatch' ? Hash.sha256('other') : f.dist.hash.digest,
      };
      if (reason === 'limit-exceeded') f.args.manifestLimits.fileBytes = 4;
      using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(new Response(bytes)));
      expect(await fromDist(f.args)).to.eql({ kind: 'manifest-refused', reason });
      expect(f.policies).to.eql([]);
    }
  });

  it('metadata-only changes → the independent pin and policy content remain unchanged', async () => {
    const f = fixture();
    const expected = structuredClone(f.dist.hash);
    f.dist.pkg = { name: '@untrusted/label', version: '9.9.9' };
    f.dist.build.time++;
    f.dist.build.size.total = 999;
    const bytes = new TextEncoder().encode(Json.stringify(f.dist, 2));
    f.args.manifestLimits.manifestBytes = bytes.length;
    using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(new Response(bytes)));
    expect((await fromDist(f.args)).kind).to.eql('ready');
    expect(f.policies).to.eql([expected]);
  });

  it('path or hash substitution → stale independent pin refuses before route selection', async () => {
    for (const change of ['path', 'hash'] as const) {
      const f = fixture();
      if (change === 'path') {
        f.dist.hash.parts['other.html'] = f.dist.hash.parts['index.html'];
        delete f.dist.hash.parts['index.html'];
      } else {
        f.dist.hash.parts['index.html'] = `${Hash.sha256('world')}:size=5`;
      }
      f.dist.hash.digest = Hash.sha256(Pkg.Dist.Content.encode(f.dist.hash.parts));
      const bytes = new TextEncoder().encode(Json.stringify(f.dist, 0));
      f.args.manifestLimits.manifestBytes = bytes.length;
      using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(new Response(bytes)));
      expect(await fromDist(f.args)).to.eql({ kind: 'manifest-refused', reason: 'pin-mismatch' });
      expect(f.policies).to.eql([]);
      expect(f.signed).to.eql(['release/dist.json']);
    }
  });

  it('refuses policy failures and non-data maps without invoking getters or thenables', async () => {
    let invoked = 0;
    const values: (() => unknown)[] = [
      () => {
        throw new Error('SECRET');
      },
      () => undefined,
      () => [],
      () => ({ '/': 'missing.html' }),
      () => ({ '/%61': 'index.html' }),
      () => Object.create({ '/': 'index.html' }),
      () =>
        new Proxy({}, {
          ownKeys() {
            invoked++;
            return [];
          },
        }),
      () => ({
        get '/'() {
          invoked++;
          return 'index.html';
        },
      }),
      () => ({ [Symbol('secret')]: 'index.html' }),
      () => ({
        then() {
          invoked++;
        },
      }),
    ];
    for (const value of values) {
      const f = fixture();
      f.args.routes = value as t.R2.ReadRoute.FromDist.Routes;
      using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(new Response(f.bytes)));
      expect(await fromDist(f.args)).to.eql({ kind: 'policy-refused' });
    }
    expect(invoked).to.eql(0);
  });

  it('ordinary async policy results → refusal observes immediate and later rejection', async () => {
    for (const immediate of [true, false]) {
      const f = fixture();
      const pending = Promise.withResolvers<never>();
      f.args.routes = (() => {
        if (immediate) pending.reject(new Error('policy-SECRET'));
        return pending.promise;
      }) as unknown as t.R2.ReadRoute.FromDist.Routes;
      using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(new Response(f.bytes)));
      const result = await fromDist(f.args);
      if (!immediate) pending.reject(new Error('policy-SECRET'));
      expect(result).to.eql({ kind: 'policy-refused' });
      expect(Object.isFrozen(result)).to.eql(true);
      // Let the host report any unobserved rejection as a test failure.
      await Time.wait(0);
    }
  });

  it('modified async policy results → no getter execution; rejection stays callback-owned', async () => {
    for (const shape of ['constructor', 'species', 'prototype', 'proxy'] as const) {
      const f = fixture();
      const pending = Promise.withResolvers<never>();
      const rejection = new Error('policy-SECRET');
      let received: unknown;
      let invoked = 0;
      // The callback owns asynchronous work outside the ordinary Promise contract.
      const owned = pending.promise.catch((error) => {
        received = error;
      });
      const fail = () => {
        invoked++;
        throw new Error('getter-SECRET');
      };
      if (shape === 'prototype') {
        Object.setPrototypeOf(
          pending.promise,
          Object.defineProperty(Object.create(Promise.prototype), 'constructor', { get: fail }),
        );
      } else if (shape !== 'proxy') {
        const descriptor = shape === 'constructor'
          ? { get: fail }
          : { value: Object.defineProperty({}, Symbol.species, { get: fail }) };
        Object.defineProperty(pending.promise, 'constructor', descriptor);
      }
      const returned = shape === 'proxy'
        ? new Proxy(pending.promise, { get: fail, getPrototypeOf: fail, ownKeys: fail })
        : pending.promise;
      const before = Object.getOwnPropertyDescriptors(pending.promise);
      const prototype = Object.getPrototypeOf(pending.promise);
      f.args.routes = (() => returned) as unknown as t.R2.ReadRoute.FromDist.Routes;
      using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(new Response(f.bytes)));
      try {
        const result = await fromDist(f.args);
        expect(result).to.eql({ kind: 'policy-refused' });
        expect(invoked).to.eql(0);
        expect(Object.getOwnPropertyDescriptors(pending.promise)).to.eql(before);
        expect(Object.getPrototypeOf(pending.promise)).to.equal(prototype);
      } finally {
        pending.reject(rejection);
        await owned;
      }
      expect(received).to.equal(rejection);
    }
  });

  it('refuses a joined payload key beyond the presigner limit after admitting the manifest', async () => {
    const f = fixture();
    f.args.prefix = 'x'.repeat(1014); // dist.json fits at 1024 bytes; index.html does not.
    using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(new Response(f.bytes)));
    expect(await fromDist(f.args)).to.eql({ kind: 'policy-refused' });
    expect(f.policies.length).to.eql(1);
    expect(f.signed).to.eql([`${f.args.prefix}/dist.json`]);
  });

  it('supports bucket-root distributions and empty or null-prototype maps', async () => {
    for (const routes of [{}, Object.assign(Object.create(null), { '/': 'index.html' })]) {
      const f = fixture();
      f.args.prefix = '';
      f.args.routes = () => routes;
      using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(new Response(f.bytes)));
      expect((await fromDist(f.args)).kind).to.eql('ready');
      expect(f.signed).to.eql(['dist.json']);
    }
  });
});
