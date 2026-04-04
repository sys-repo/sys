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
import { type t } from '../common.ts';
import { useVerify } from '../use.Verify.ts';

describe('HttpOrigin.useVerify', () => {
  DomMock.init({ beforeEach, afterEach });

  it('default resolver fetches <origin>/dist.json and settles ok', async () => {
    const dist = SAMPLE.dist();
    const server = Testing.Http.server((req) => {
      const url = new URL(req.url);
      if (url.pathname === '/dist.json') return Testing.Http.json(dist);
      return new Response('Not found', { status: 404 });
    });

    const rows: readonly t.UrlRow[] = [{ key: 'app', url: server.url.toURL().origin }];
    const { result, unmount } = renderHook(() =>
      useVerify({ env: 'production', rows, verify: true }),
    );

    try {
      act(() => result.current.onVerify());
      await waitFor(() => result.current.running === false);
      expect(result.current.status).to.eql({ app: 'ok' });
      expect(result.current.reserveStatusSpace).to.eql(true);
    } finally {
      unmount();
      await server.dispose();
    }
  });

  it('custom resolveUrl is honored', async () => {
    const dist = SAMPLE.dist();
    const server = Testing.Http.server((req) => {
      const url = new URL(req.url);
      if (url.pathname === '/verify.json') return Testing.Http.json(dist);
      return new Response('Not found', { status: 404 });
    });

    const rows: readonly t.UrlRow[] = [{ key: 'cdn', url: server.url.toURL().origin }];
    const verify: t.HttpOrigin.Verify = {
      resolveUrl: ({ origin }) => `${origin}/verify.json`,
    };
    const { result, unmount } = renderHook(() =>
      useVerify({ env: 'production', rows, verify }),
    );

    try {
      act(() => result.current.onVerify());
      await waitFor(() => result.current.running === false);
      expect(result.current.status).to.eql({ cdn: 'ok' });
    } finally {
      unmount();
      await server.dispose();
    }
  });

  it('settles error when dist.json is missing', async () => {
    const server = Testing.Http.server(() => new Response('Not found', { status: 404 }));
    const rows: readonly t.UrlRow[] = [{ key: 'video', url: server.url.toURL().origin }];
    const { result, unmount } = renderHook(() =>
      useVerify({ env: 'production', rows, verify: true }),
    );

    try {
      act(() => result.current.onVerify());
      await waitFor(() => result.current.running === false);
      expect(result.current.status).to.eql({ video: 'error' });
      expect(result.current.reserveStatusSpace).to.eql(true);
    } finally {
      unmount();
      await server.dispose();
    }
  });
});

const SAMPLE = {
  dist(): t.DistPkg {
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
        digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
        parts: {
          './index.html': 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
        },
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
