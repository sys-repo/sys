import { useEffect } from 'react';
import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  renderHook,
  Testing,
} from '../../../-test.ts';
import { Hash, Obj, Pkg, Rx, type t } from '../common.ts';
import { Data } from '../m.Data.ts';
import { useVerify } from '../use.Verify.ts';

describe('HttpOrigin.useVerify', () => {
  DomMock.init({ beforeEach, afterEach });
  let originalFetch = globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    // Runs even when hook setup or unmount fails.
    globalThis.fetch = originalFetch;
  });

  it('default resolver fetches <origin>/dist.json and settles ok', async () => {
    const dist = SAMPLE.dist();
    const server = Testing.Http.server((req) => {
      const url = new URL(req.url);
      if (url.pathname === '/dist.json') return Testing.Http.json(dist);
      return new Response('Not found', { status: 404 });
    });
    await using _serverCleanup = Rx.lifecycleAsync(() => server.dispose());

    const rows: readonly t.HttpOrigin.UrlRow[] = [{ key: 'app', url: server.url.toURL().origin }];
    const { result, unmount } = renderHook(() => {
      return useVerify({ env: 'production', rows, verify: true });
    });

    try {
      act(() => result.current.onVerify());
      await waitFor(() => result.current.running === false);
      expect(result.current.status).to.eql({ app: 'ok' });
      expect(result.current.digest).to.eql({ app: dist.hash.digest });
      expect(result.current.reserveStatusSpace).to.eql(true);
    } finally {
      unmount();
    }
  });

  it('StrictMode effect replay → fresh observation lifetime', async () => {
    const dist = SAMPLE.dist();
    const server = Testing.Http.server(() => Testing.Http.json(dist));
    await using _serverCleanup = Rx.lifecycleAsync(() => server.dispose());
    const rows: readonly t.HttpOrigin.UrlRow[] = [{ key: 'app', url: server.url.toURL().origin }];
    let setups = 0;
    let cleanups = 0;
    const hook = renderHook(() => {
      useEffect(() => {
        setups++;
        return () => {
          cleanups++;
        };
      }, []);
      return useVerify({ env: 'production', rows, verify: true });
    }, { reactStrictMode: true });
    try {
      expect(setups).to.eql(2);
      expect(cleanups).to.eql(1);
      act(() => hook.result.current.onVerify());
      await waitFor(() => !hook.result.current.running);
      expect(hook.result.current.status).to.eql({ app: 'ok' });
      expect(hook.result.current.digest).to.eql({ app: dist.hash.digest });
      expect(hook.result.current.actionLabel).to.eql('observed (unpinned)');
    } finally {
      hook.unmount();
    }
  });

  it('schema-only observation → self-reported digest without payload verification', async () => {
    const dist = SAMPLE.dist();
    const digest = `sha256-${'f'.repeat(64)}`;
    const requests: string[] = [];
    const server = Testing.Http.server((req) => {
      requests.push(new URL(req.url).pathname);
      return Testing.Http.json({ ...dist, hash: { ...dist.hash, digest } });
    });
    await using _serverCleanup = Rx.lifecycleAsync(() => server.dispose());
    const rows: readonly t.HttpOrigin.UrlRow[] = [{ key: 'app', url: server.url.toURL().origin }];
    const { result, unmount } = renderHook(() => {
      return useVerify({ env: 'production', rows, verify: true });
    });

    try {
      expect(result.current.actionLabel).to.eql('observe manifests');
      act(() => result.current.onVerify());
      await waitFor(() => result.current.running === false);
      expect(result.current.status).to.eql({ app: 'ok' });
      expect(result.current.digest).to.eql({ app: digest });
      expect(result.current.actionLabel).to.eql('observed (unpinned)');
      expect(requests).to.eql(['/dist.json']);
    } finally {
      unmount();
    }
  });

  for (const action of ['replace', 'unmount'] as const) {
    it(`pending observation ${action} → abort and no stale result publication`, async () => {
      const original = globalThis.fetch;
      const entered = Promise.withResolvers<void>();
      const pending = Promise.withResolvers<Response>();
      const oldDist = SAMPLE.dist();
      const nextDist = {
        ...oldDist,
        hash: { ...oldDist.hash, digest: `sha256-${'e'.repeat(64)}` },
      };
      const rows: readonly t.HttpOrigin.UrlRow[] = [{ key: 'app', url: 'https://example.test' }];
      let requests = 0;
      let signal: AbortSignal | null | undefined;
      let oldUrl = '';
      let renders = 0;
      const response = (url: string, dist: t.DistPkg) => {
        const value = Testing.Http.json(dist);
        Object.defineProperty(value, 'url', { value: url });
        return value;
      };
      globalThis.fetch = (input, init) => {
        if (++requests > 1) return Promise.resolve(response(String(input), nextDist));
        oldUrl = String(input);
        signal = init?.signal;
        entered.resolve();
        return pending.promise;
      };
      const hook = renderHook(({ verify }) => {
        renders++;
        return useVerify({ env: 'production', rows, verify });
      }, { initialProps: { verify: true } });
      try {
        act(() => hook.result.current.onVerify());
        await entered.promise;
        if (action === 'unmount') hook.unmount();
        else {
          hook.rerender({ verify: false });
          expect(hook.result.current.status).to.eql({});
          expect(hook.result.current.digest).to.eql({});
          hook.rerender({ verify: true });
          act(() => hook.result.current.onVerify());
          await waitFor(() => !hook.result.current.running);
          expect(hook.result.current.digest).to.eql({ app: nextDist.hash.digest });
        }
        const before = renders;
        await act(async () => {
          pending.resolve(response(oldUrl, oldDist));
          await Testing.wait(10);
        });
        expect(signal?.aborted).to.eql(true);
        expect(renders).to.eql(before);
        if (action === 'replace') {
          expect(requests).to.eql(2);
          expect(hook.result.current.status).to.eql({ app: 'ok' });
          expect(hook.result.current.digest).to.eql({ app: nextDist.hash.digest });
          expect(hook.result.current.actionLabel).to.eql('observed (unpinned)');
        }
      } finally {
        pending.resolve(new Response());
        hook.unmount();
        globalThis.fetch = original;
      }
    });
  }

  for (const outcome of ['success', 'error'] as const) {
    it(`own origin keys ${outcome} → exact requests and terminal observation membership`, async () => {
      const dist = SAMPLE.dist();
      const requests: string[] = [];
      const keys = ['__proto__', 'constructor', 'toString', 'ordinary'];
      const server = Testing.Http.server((req) => {
        const path = new URL(req.url).pathname;
        requests.push(path);
        if (outcome === 'error' && path === '/__proto__/dist.json') {
          return new Response('Not found', { status: 404 });
        }
        return Testing.Http.json(dist);
      });
      await using _serverCleanup = Rx.lifecycleAsync(() => server.dispose());
      const base = server.url.toURL().origin;
      const origin: t.HttpOrigin.UrlTree = {
        ['__proto__']: `${base}/__proto__`,
        constructor: `${base}/constructor`,
        toString: `${base}/toString`,
        ordinary: `${base}/ordinary`,
      };
      const rows = Data.flatten(origin);
      expect(rows.map((row) => row.key)).to.eql(keys);
      const hook = renderHook(() => useVerify({ env: 'production', origin, rows, verify: true }));
      try {
        // Idle maps must not report inherited prototype members as observation values.
        for (const key of keys) {
          expect(hook.result.current.status[key]).to.eql(undefined);
          expect(hook.result.current.digest[key]).to.eql(undefined);
        }
        act(() => hook.result.current.onVerify());
        await waitFor(() => !hook.result.current.running);
        expect(requests.sort()).to.eql(keys.map((key) => `/${key}/dist.json`).sort());
        expect(Obj.keys(hook.result.current.status).sort()).to.eql([...keys].sort());
        expect(Obj.keys(hook.result.current.digest).sort()).to.eql([...keys].sort());
        for (const key of keys) {
          const failed = outcome === 'error' && key === '__proto__';
          expect(Obj.hasOwn(hook.result.current.status, key)).to.eql(true);
          expect(Obj.hasOwn(hook.result.current.digest, key)).to.eql(true);
          expect(hook.result.current.status[key]).to.eql(failed ? 'error' : 'ok');
          expect(hook.result.current.digest[key]).to.eql(failed ? undefined : dist.hash.digest);
        }
        expect(hook.result.current.actionLabel).to.eql(
          outcome === 'error' ? 'has failures' : 'observed (unpinned)',
        );
      } finally {
        hook.unmount();
      }
    });
  }

  for (const failure of ['malformed', 'throwing'] as const) {
    it(`resolver ${failure} → terminal row error, independent sibling success`, async () => {
      const dist = SAMPLE.dist();
      const server = Testing.Http.server(() => Testing.Http.json(dist));
      await using _serverCleanup = Rx.lifecycleAsync(() => server.dispose());
      const base = server.url.toURL().origin;
      const requests: string[] = [];
      const original = globalThis.fetch;
      globalThis.fetch = (input, init) => {
        requests.push(String(input));
        return original(input, init);
      };
      const rows = Data.flatten({ bad: `${base}/bad`, ok: `${base}/ok` });
      const verify: t.HttpOrigin.Verify = {
        resolveUrl({ key, origin }) {
          if (key !== 'bad') return `${origin}/dist.json`;
          if (failure === 'throwing') throw new Error('Fixture resolver failure.');
          return 'not-a-url';
        },
      };
      const hook = renderHook(() => useVerify({ env: 'production', rows, verify }));
      try {
        act(() => hook.result.current.onVerify());
        await waitFor(() => !hook.result.current.running);
        expect(hook.result.current.status).to.eql({ bad: 'error', ok: 'ok' });
        expect(hook.result.current.digest.bad).to.eql(undefined);
        expect(hook.result.current.digest.ok).to.eql(dist.hash.digest);
        expect(hook.result.current.actionLabel).to.eql('has failures');
        expect(hook.result.current.reserveStatusSpace).to.eql(true);
        expect(requests).to.eql([`${base}/ok/dist.json`]);
      } finally {
        hook.unmount();
      }
    });
  }

  it('success → pending next run → current digest and action state only', async () => {
    const first = SAMPLE.dist();
    const next = { ...first, hash: { ...first.hash, digest: `sha256-${'e'.repeat(64)}` } };
    const entered = Promise.withResolvers<void>();
    const pending = Promise.withResolvers<Response>();
    const rows: readonly t.HttpOrigin.UrlRow[] = [{ key: 'app', url: 'https://example.test' }];
    let requests = 0;
    let nextUrl = '';
    const response = (url: string, dist: t.DistPkg) => {
      const value = Testing.Http.json(dist);
      Object.defineProperty(value, 'url', { value: url });
      return value;
    };
    globalThis.fetch = (input) => {
      if (++requests === 1) return Promise.resolve(response(String(input), first));
      nextUrl = String(input);
      entered.resolve();
      return pending.promise;
    };
    const hook = renderHook(() => useVerify({ env: 'production', rows, verify: true }));
    try {
      act(() => hook.result.current.onVerify());
      await waitFor(() => !hook.result.current.running);
      expect(hook.result.current.digest).to.eql({ app: first.hash.digest });
      expect(hook.result.current.actionLabel).to.eql('observed (unpinned)');

      act(() => hook.result.current.onVerify());
      await entered.promise;
      expect(hook.result.current.running).to.eql(true);
      expect(hook.result.current.status).to.eql({ app: 'running' });
      expect(hook.result.current.digest).to.eql({});
      expect(hook.result.current.actionLabel).to.eql('observe manifests');
      await act(async () => {
        pending.resolve(response(nextUrl, next));
        await Testing.wait(10);
      });
      await waitFor(() => !hook.result.current.running);
      expect(hook.result.current.digest).to.eql({ app: next.hash.digest });
      expect(hook.result.current.status).to.eql({ app: 'ok' });
      expect(requests).to.eql(2);
    } finally {
      pending.resolve(new Response());
      hook.unmount();
    }
  });

  it('custom resolveUrl is honored', async () => {
    const dist = SAMPLE.dist();
    const server = Testing.Http.server((req) => {
      const url = new URL(req.url);
      if (url.pathname === '/verify.json') return Testing.Http.json(dist);
      return new Response('Not found', { status: 404 });
    });
    await using _serverCleanup = Rx.lifecycleAsync(() => server.dispose());

    const rows: readonly t.HttpOrigin.UrlRow[] = [{ key: 'cdn', url: server.url.toURL().origin }];
    const verify: t.HttpOrigin.Verify = {
      resolveUrl: ({ origin }) => `${origin}/verify.json`,
    };
    const { result, unmount } = renderHook(() => useVerify({ env: 'production', rows, verify }));

    try {
      act(() => result.current.onVerify());
      await waitFor(() => result.current.running === false);
      expect(result.current.status).to.eql({ cdn: 'ok' });
    } finally {
      unmount();
    }
  });

  it('settles error when dist.json is missing', async () => {
    const server = Testing.Http.server(() => new Response('Not found', { status: 404 }));
    await using _serverCleanup = Rx.lifecycleAsync(() => server.dispose());
    const rows: readonly t.HttpOrigin.UrlRow[] = [{ key: 'video', url: server.url.toURL().origin }];
    const { result, unmount } = renderHook(() => {
      return useVerify({ env: 'production', rows, verify: true });
    });

    try {
      act(() => result.current.onVerify());
      await waitFor(() => result.current.running === false);
      expect(result.current.status).to.eql({ video: 'error' });
      expect(result.current.reserveStatusSpace).to.eql(true);
    } finally {
      unmount();
    }
  });

  it('settles error when response JSON is not a valid dist manifest', async () => {
    const server = Testing.Http.server(() => Testing.Http.json({ ok: true, kind: 'not-a-dist' }));
    await using _serverCleanup = Rx.lifecycleAsync(() => server.dispose());
    const rows: readonly t.HttpOrigin.UrlRow[] = [{ key: 'app', url: server.url.toURL().origin }];
    const { result, unmount } = renderHook(() => {
      return useVerify({ env: 'production', rows, verify: true });
    });

    try {
      act(() => result.current.onVerify());
      await waitFor(() => result.current.running === false);
      expect(result.current.status).to.eql({ app: 'error' });
      expect(result.current.actionLabel).to.eql('has failures');
      expect(result.current.reserveStatusSpace).to.eql(true);
    } finally {
      unmount();
    }
  });
});

const SAMPLE = {
  dist(): t.DistPkg {
    const parts = { 'index.html': `${Hash.sha256('fixture')}:size=7` };
    return {
      type: 'https://jsr.io/@sample/foo',
      pkg: { name: '@ns/foo', version: '1.2.3' },
      build: {
        time: 1746520471244,
        size: { total: 1234, pkg: 1234 },
        builder: '@scope/sample@0.0.0',
        runtime: '<runtime-uri>',
        hash: { policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts' },
      },
      hash: {
        scheme: 'sys.dist/v2',
        digest: Hash.sha256(Pkg.Dist.Content.encode(parts)),
        parts,
      },
    };
  },
} as const;

async function waitFor(predicate: () => boolean, timeout = 500) {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeout) throw new Error('Timed out waiting for predicate');
    await act(async () => {
      await Testing.wait(10);
    });
  }
}
