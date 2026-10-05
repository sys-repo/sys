import { describe, expect, expectError, it, type t, Testing, WebFixture } from '../../-test.ts';
import {
  expectRecovery,
  expectResponsePolicy,
  forbidFetch,
  origin,
  request,
  setup,
} from './u.fixture.readRoute.ts';

describe('R2.ReadRoute: operation ownership', () => {
  it('refuses pre-aborted requests before authorization, signing, or fetch', async () => {
    const caller = new AbortController();
    caller.abort('caller-SECRET');
    using fetch = forbidFetch();
    const { handler, signed, authorized } = setup();
    const response = await handler(request('/', { signal: caller.signal }));
    expect(response.status).to.eql(499);
    expect(await response.text()).to.eql('');
    expect(signed).to.eql([]);
    expect(authorized).to.eql([]);
    expect(fetch.calls).to.eql(0);
    expectResponsePolicy(response);
  });

  it('caller abort → signal stalled fetch and recover after transport settlement', async () => {
    const caller = new AbortController();
    let fetched = 0;
    let started = false;
    let aborted = false;
    using _fetch = WebFixture.Fetch.mock((_input, init) => {
      fetched++;
      if (fetched > 1) return Promise.resolve(new Response('ok'));
      started = true;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          aborted = true;
          reject(new Error('transport-SECRET'));
        }, { once: true });
      });
    });
    const { handler } = setup();
    const pending = handler(request('/', { signal: caller.signal }));
    try {
      await Testing.until(() => started);
      caller.abort('caller-SECRET');
      const response = await pending;
      expect(response.status).to.eql(499);
      expect(await response.text()).to.eql('');
      expect(aborted).to.eql(true);
      await expectRecovery(handler);
      expect(fetched).to.eql(2);
    } finally {
      caller.abort();
      await pending;
    }
  });

  it('timeout → retain capacity through late fetch and delayed body cancellation', async () => {
    const fetchGate = Promise.withResolvers<Response>();
    const cleanup = Promise.withResolvers<void>();
    let fetched = 0;
    let cancelled = 0;
    let signal: AbortSignal | undefined;
    using _fetch = WebFixture.Fetch.mock((_input, init) => {
      fetched++;
      signal = init?.signal ?? undefined;
      return fetched === 1 ? fetchGate.promise : Promise.resolve(new Response('ok'));
    });
    const { handler } = setup({ limits: { maxBytes: 8, timeout: 20, maxConcurrent: 1 } });
    const pending = handler(request('/'));
    try {
      await Testing.until(() => fetched === 1);
      const response = await pending;
      expect(response.status).to.eql(504);
      expect(signal?.aborted).to.eql(true);
      expect((await handler(request('/'))).status).to.eql(503);
      const body = new ReadableStream<Uint8Array>({
        cancel() {
          cancelled++;
          return cleanup.promise;
        },
      });
      fetchGate.resolve(new Response(body));
      await Testing.until(() => cancelled === 1);
      expect((await handler(request('/'))).status).to.eql(503);
      expect(fetched).to.eql(1);
      cleanup.resolve();
      await expectRecovery(handler);
      expect(cancelled).to.eql(1);
      expect(fetched).to.eql(2);
    } finally {
      fetchGate.resolve(new Response(null));
      cleanup.resolve();
      await pending;
    }
  });

  describe('stalled body', () => {
    for (const cause of ['caller', 'deadline'] as const) {
      it(`${cause} → cancel once and retain capacity until cleanup settles`, async () => {
        const caller = new AbortController();
        const cleanup = Promise.withResolvers<void>();
        let fetched = 0;
        let reading = false;
        let cancelled = 0;
        using _fetch = WebFixture.Fetch.mock(() => {
          fetched++;
          if (fetched > 1) return Promise.resolve(new Response('ok'));
          const body = new ReadableStream<Uint8Array>({
            pull() {
              reading = true;
            },
            cancel() {
              cancelled++;
              return cleanup.promise;
            },
          });
          return Promise.resolve(new Response(body));
        });
        const timeout = cause === 'caller' ? 1000 : 20;
        const { handler } = setup({ limits: { maxBytes: 8, timeout, maxConcurrent: 1 } });
        const pending = handler(request('/', { signal: caller.signal }));
        try {
          await Testing.until(() => reading);
          if (cause === 'caller') caller.abort();
          const response = await pending;
          expect(response.status).to.eql(cause === 'caller' ? 499 : 504);
          expect(cancelled).to.eql(1);
          expect((await handler(request('/'))).status).to.eql(503);
          expect(fetched).to.eql(1);
          cleanup.resolve();
          await expectRecovery(handler);
          expect(cancelled).to.eql(1);
        } finally {
          caller.abort();
          cleanup.resolve();
          await pending;
        }
      });
    }
  });

  describe('late work before fetch', () => {
    for (const stage of ['authorization', 'signing'] as const) {
      it(`${stage} → no fetch or capacity release before settlement`, async () => {
        const authorization = Promise.withResolvers<boolean>();
        const signing = Promise.withResolvers<string>();
        let authorized = 0;
        let signed = 0;
        let fetched = 0;
        let signal: AbortSignal | undefined;
        const href = `${origin}/assets/index.html`;
        using _fetch = WebFixture.Fetch.mock(() => {
          fetched++;
          return Promise.resolve(new Response('ok'));
        });
        const { handler } = setup({
          limits: { maxBytes: 8, timeout: 20, maxConcurrent: 1 },
          authorize(args) {
            signal = args.signal;
            authorized++;
            if (stage === 'authorization' && authorized === 1) return authorization.promise;
            return true;
          },
          bucket: {
            name: 'assets',
            presignGet() {
              signed++;
              return signed === 1 && stage === 'signing' ? signing.promise : Promise.resolve(href);
            },
          },
        });
        const pending = handler(request('/'));
        try {
          const response = await pending;
          expect(response.status).to.eql(504);
          expect(signal?.aborted).to.eql(true);
          expect((await handler(request('/'))).status).to.eql(503);
          expect(fetched).to.eql(0);
          authorization.resolve(true);
          signing.resolve(href);
          await expectRecovery(handler);
          expect(fetched).to.eql(1);
          expect(authorized).to.eql(2);
          expect(signed).to.eql(stage === 'authorization' ? 1 : 2);
        } finally {
          authorization.resolve(true);
          signing.resolve(href);
          await pending;
        }
      });
    }
  });

  it('overflow → retain capacity through slow cleanup and tolerate cancellation rejection', async () => {
    const cleanup = Promise.withResolvers<void>();
    let fetched = 0;
    let cancelled = 0;
    using _fetch = WebFixture.Fetch.mock(() => {
      fetched++;
      if (fetched > 1) return Promise.resolve(new Response('ok'));
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(9));
        },
        cancel() {
          cancelled++;
          return cleanup.promise;
        },
      });
      return Promise.resolve(new Response(body));
    });
    const { handler } = setup({ limits: { maxBytes: 8, timeout: 20, maxConcurrent: 1 } });
    const pending = handler(request('/'));
    try {
      await Testing.until(() => cancelled === 1);
      const response = await pending;
      expect(response.status).to.eql(504);
      expect((await handler(request('/'))).status).to.eql(503);
      cleanup.reject(new Error('cleanup-SECRET'));
      await expectRecovery(handler);
      expect(cancelled).to.eql(1);
      expect(fetched).to.eql(2);
    } finally {
      cleanup.resolve();
      await pending;
    }
  });

  it('saturation → refuse immediately without queueing or authorizing another request', async () => {
    const gate = Promise.withResolvers<Response>();
    let fetched = 0;
    using _fetch = WebFixture.Fetch.mock(() => {
      fetched++;
      return gate.promise;
    });
    const { handler, authorized, signed } = setup();
    const pending = handler(request('/'));
    try {
      await Testing.until(() => fetched === 1);
      const refused = await handler(request('/assets/app.js'));
      expect(refused.status).to.eql(503);
      expect(authorized).to.eql(['index.html']);
      expect(signed).to.eql(['index.html']);
      expectResponsePolicy(refused);
      gate.resolve(new Response('ok'));
      const response = await pending;
      expect(response.status).to.eql(200);
      expect(await response.text()).to.eql('ok');
      expect(fetched).to.eql(1);
    } finally {
      gate.resolve(new Response(null));
      await pending;
    }
  });

  it('recovery observation → never retries an unexpected response or rejection', async () => {
    const cases = [
      { label: 'status', respond: () => Promise.resolve(new Response(null, { status: 502 })) },
      { label: 'body', respond: () => Promise.resolve(new Response('wrong')) },
      { label: 'rejection', respond: () => Promise.reject(new Error('Unexpected rejection')) },
    ];
    for (const { label, respond } of cases) {
      let calls = 0;
      const handler: t.R2.ReadRoute.Handler = () => {
        calls++;
        return calls === 1 ? respond() : Promise.resolve(new Response('ok'));
      };
      await expectError(() => expectRecovery(handler));
      expect(calls, label).to.eql(1);
    }
  });
});
