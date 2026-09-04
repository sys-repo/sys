import { Hash } from '@sys/crypto/hash';
import { describe, expect, it, Json, type t, Testing, WebFixture } from '../../../-test.ts';
import { Fetch } from '../mod.ts';
import { verifyChecksum } from '../u/u.checksum.ts';
import { createInvokeFetch } from '../u/u.invoke.ts';
import { makeFetchWith } from '../u/u.make.ts';
import { responsePolicy } from './u.fixture.ts';

const ORIGIN = 'https://example.test';
const RESOURCE_URL = `${ORIGIN}/resource`;
const SECRET = {
  authorization: 'Bearer AUTHORIZATION-SECRET',
  cookie: 'session=COOKIE-SECRET',
  reason: 'CALLER-ABORT-SECRET',
} as const;

const policy = (overrides: Partial<t.HttpFetch.ResponsePolicy> = {}) =>
  responsePolicy([ORIGIN], overrides);

const makeClient = (
  policyOverrides: Partial<t.HttpFetch.ResponsePolicy> = {},
  options: Omit<t.HttpFetch.CreateOptions, 'policy'> = {},
) => Fetch.make({ ...options, policy: policy(policyOverrides) });

describe('Http.Fetch: bounded response policy', () => {
  it('exposes one canonical response and snapshots construction authority', async () => {
    const calls: Array<{ readonly url: string; readonly init: RequestInit }> = [];
    const mock = WebFixture.Fetch.mock((input, init = {}) => {
      const url = input instanceof Request ? input.url : String(input);
      calls.push({ url, init });
      return Promise.resolve(new Response(new Uint8Array([1, 2, 3])));
    });
    const sources = [ORIGIN];
    const client = Fetch.make({
      policy: policy({ sourceOrigins: sources }),
      accessToken: SECRET.authorization,
    });
    const credentialOptions: t.Mutable<t.HttpFetch.CreateOptions> = {
      policy: policy({ credentialOrigins: [ORIGIN] }),
      accessToken: SECRET.authorization,
    };
    const credentialClient = Fetch.make(credentialOptions);
    const longTimeoutClient = makeClient({ timeout: Number.MAX_SAFE_INTEGER });
    const input = `${RESOURCE_URL}?version=1#fragment`;
    sources.length = 0;
    credentialOptions.accessToken = 'Bearer MUTATED-AUTHORIZATION-SECRET';

    try {
      const bounded: t.HttpFetch.Response<Blob> = await client.blob(input, {
        headers: { cookie: SECRET.cookie },
      });
      const credentialed = await credentialClient.text(RESOURCE_URL);
      const longTimeout = await longTimeoutClient.text(RESOURCE_URL);

      expect(bounded.ok).to.eql(true);
      if (bounded.ok) {
        expect(bounded.requestedUrl).to.eql(`${RESOURCE_URL}?version=1`);
        expect(bounded.finalUrl).to.eql(`${RESOURCE_URL}?version=1`);
        expect(new Uint8Array(await bounded.data.arrayBuffer())).to.eql(new Uint8Array([1, 2, 3]));
      }
      expect(Object.keys(bounded)).to.eql([
        'ok',
        'status',
        'statusText',
        'headers',
        'data',
        'error',
        'checksum',
        'requestedUrl',
        'finalUrl',
      ]);
      expect('url' in bounded).to.eql(false);
      expect(credentialed.ok).to.eql(true);
      expect(longTimeout.ok).to.eql(true);

      expect(calls[0].url).to.eql(`${RESOURCE_URL}?version=1`);
      expect(calls[0].init.redirect).to.eql('manual');
      expect(calls[0].init.credentials).to.eql('omit');
      expect(calls[0].init.referrerPolicy).to.eql('no-referrer');
      expect(new Headers(calls[0].init.headers).get('authorization')).to.eql(null);
      expect(new Headers(calls[0].init.headers).get('cookie')).to.eql(null);
      expect(new Headers(calls[1].init.headers).get('authorization')).to.eql(
        SECRET.authorization,
      );
    } finally {
      client.dispose();
      credentialClient.dispose();
      longTimeoutClient.dispose();
      mock.dispose();
    }
  });

  it('rejects invalid policies, requests, URLs, and source origins before network', async () => {
    let calls = 0;
    const mock = WebFixture.Fetch.mock(() => {
      calls++;
      return Promise.resolve(new Response('unexpected'));
    });
    const client = makeClient();

    try {
      const invalidPolicies: readonly t.HttpFetch.ResponsePolicy[] = [
        policy({ timeout: 0 }),
        policy({ timeout: Number.NaN }),
        policy({ progressInterval: 0 }),
        policy({ maxBytes: -1 }),
        policy({ maxBytes: Number.POSITIVE_INFINITY }),
        policy({ maxRedirects: -1 }),
        policy({ sourceOrigins: [] }),
        policy({ sourceOrigins: [ORIGIN, ORIGIN] }),
        policy({ sourceOrigins: [`${ORIGIN}/path`] }),
        policy({ sourceOrigins: ['https://user@example.test'] }),
        policy({ sourceOrigins: [ORIGIN], credentialOrigins: ['https://other.test'] }),
      ];

      for (const invalid of invalidPolicies) {
        const invalidClient = Fetch.make({ policy: invalid });
        try {
          assertPolicyFailure(
            await invalidClient.text(RESOURCE_URL),
            'invalid-policy',
            400,
          );
        } finally {
          invalidClient.dispose();
        }
      }

      const invalidCreateOptions = [
        { policy: policy(), headers: 123 },
        { policy: policy(), accessToken: 123 },
        { policy: policy(), until: {} },
        { policy: policy(), contentTypePolicy: 'other' },
        Object.defineProperty({}, 'policy', {
          get() {
            throw new Error('HOSTILE-POLICY-GETTER-SECRET');
          },
        }),
      ] as unknown as readonly t.HttpFetch.CreateOptions[];
      for (const options of invalidCreateOptions) {
        const invalidClient = Fetch.make(options);
        try {
          assertPolicyFailure(
            await invalidClient.text(RESOURCE_URL),
            'invalid-policy',
            400,
          );
        } finally {
          invalidClient.dispose();
        }
      }

      const invalidInit = [
        { method: 'POST' },
        { method: undefined },
        { body: 'no' },
        { body: null },
        { redirect: 'follow' },
        { credentials: 'include' },
        { referrer: ORIGIN },
        { referrerPolicy: 'origin' },
      ] as unknown as readonly t.HttpFetch.Init[];
      for (const init of invalidInit) {
        assertPolicyFailure(
          await client.text(RESOURCE_URL, init),
          'invalid-request',
          400,
        );
      }

      const invalidOptions = [
        [],
        { onProgress: 123 },
        { checksum: 123 },
      ] as unknown as readonly t.HttpFetch.Options[];
      for (const options of invalidOptions) {
        assertPolicyFailure(
          await client.text(RESOURCE_URL, {}, options),
          'invalid-request',
          400,
        );
      }

      const relative = await client.text('/relative');
      assertPolicyFailure(relative, 'invalid-url', 400);

      const denied = await client.text('https://other.test/resource');
      assertPolicyFailure(denied, 'source-denied', 403);
      expect(calls).to.eql(0);
    } finally {
      client.dispose();
      mock.dispose();
    }
  });

  it('rejects declared oversized bodies before reading and clears policy headers', async () => {
    let cancellations = 0;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3, 4, 5]));
      },
      cancel() {
        cancellations++;
      },
    });
    const mock = WebFixture.Fetch.mock(() =>
      Promise.resolve(
        new Response(body, {
          headers: { 'content-length': '5', 'x-response-secret': 'response-secret' },
        }),
      )
    );
    const client = makeClient({ maxBytes: 4 });

    try {
      const secret = 'QUERY-SECRET';
      const res = await client.blob(`${RESOURCE_URL}?token=${secret}#fragment`);
      assertPolicyFailure(res, 'response-too-large', 413);
      expect(res.url).to.eql(RESOURCE_URL);
      expect([...res.headers]).to.eql([]);
      expect(res.error.headers).to.eql({});
      expect(Json.stringify(res).includes(secret)).to.eql(false);
      expect(cancellations).to.eql(1);
    } finally {
      client.dispose();
      mock.dispose();
    }
  });

  it('accounts streamed bytes before retention when declared size is invalid', async () => {
    let cancellations = 0;
    const progress: t.HttpFetch.ResponsePolicy.ProgressEvent[] = [];
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.enqueue(new Uint8Array([4, 5, 6]));
      },
      cancel() {
        cancellations++;
      },
    });
    const mock = WebFixture.Fetch.mock(() =>
      Promise.resolve(new Response(body, { headers: { 'content-length': 'invalid' } }))
    );
    const client = makeClient({ maxBytes: 5 });

    try {
      const res = await client.blob(RESOURCE_URL, {}, {
        onProgress: (event) => progress.push(event),
      });
      assertPolicyFailure(res, 'response-too-large', 413);
      expect(res.data).to.eql(undefined);
      expect(progress.map((event) => event.loaded)).to.eql([3, 6]);
      expect(progress.every((event) => event.complete === false)).to.eql(true);
      expect(cancellations).to.eql(1);
    } finally {
      client.dispose();
      mock.dispose();
    }
  });

  it('times out fetch and body stalls without accepting late work', async () => {
    let resolveFetch: (response: Response) => void = () => {};
    let lateCancellations = 0;
    const progress: t.HttpFetch.ResponsePolicy.ProgressEvent[] = [];
    const mock = WebFixture.Fetch.mock(() =>
      new Promise<Response>((resolve) => (resolveFetch = resolve))
    );
    const client = makeClient({ timeout: 10 });

    try {
      const pending = client.text(RESOURCE_URL, {}, {
        onProgress: (event) => progress.push(event),
      });
      const timedOut = await pending;
      assertPolicyFailure(timedOut, 'response-timeout', 408);

      const lateBody = new ReadableStream<Uint8Array>({
        cancel() {
          lateCancellations++;
        },
      });
      resolveFetch(new Response(lateBody));
      await Testing.until(() => lateCancellations === 1);
      expect(progress).to.eql([]);
    } finally {
      client.dispose();
      mock.dispose();
    }

    let stalledCancellations = 0;
    const stalledMock = WebFixture.Fetch.mock(() =>
      Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            cancel() {
              stalledCancellations++;
            },
          }),
        ),
      )
    );
    const stalledClient = makeClient({ timeout: 10 });

    try {
      const res = await stalledClient.text(RESOURCE_URL);
      assertPolicyFailure(res, 'response-timeout', 408);
      expect(stalledCancellations).to.eql(1);
    } finally {
      stalledClient.dispose();
      stalledMock.dispose();
    }
  });

  it('bounds progress cadence and fails closed on invalid callbacks', async () => {
    const events: t.HttpFetch.ResponsePolicy.ProgressEvent[] = [];
    const response = () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new Uint8Array([1]));
            controller.enqueue(new Uint8Array([2, 3]));
            controller.close();
          },
        }),
        { headers: { 'content-length': '3' } },
      );
    const mock = WebFixture.Fetch.mock(() => Promise.resolve(response()));
    const client = makeClient({ progressInterval: 1000 });

    try {
      const res = await client.blob(RESOURCE_URL, {}, {
        onProgress: (event) => events.push(event),
      });
      expect(res.ok).to.eql(true);
      expect(events.map(({ loaded, complete }) => ({ loaded, complete }))).to.eql([
        { loaded: 1, complete: false },
        { loaded: 3, complete: true },
      ]);
      expect(events.every((event) => event.total === 3)).to.eql(true);
    } finally {
      client.dispose();
      mock.dispose();
    }

    const emptyEvents: t.HttpFetch.ResponsePolicy.ProgressEvent[] = [];
    const emptyMock = WebFixture.Fetch.mock(() => Promise.resolve(new Response(null)));
    const emptyClient = makeClient({ maxBytes: 0 });
    try {
      const res = await emptyClient.text(RESOURCE_URL, {}, {
        onProgress: (event) => emptyEvents.push(event),
      });
      expect(res.ok).to.eql(true);
      expect(emptyEvents.map(({ loaded, complete }) => ({ loaded, complete }))).to.eql([
        { loaded: 0, complete: true },
      ]);
    } finally {
      emptyClient.dispose();
      emptyMock.dispose();
    }

    for (
      const handler of [
        () => {
          throw new Error('progress-secret');
        },
        (() => Promise.resolve()) as unknown as t.HttpFetch.ResponsePolicy.ProgressHandler,
      ]
    ) {
      let cancellations = 0;
      const callbackMock = WebFixture.Fetch.mock(() =>
        Promise.resolve(
          new Response(
            new ReadableStream<Uint8Array>({
              start(controller) {
                controller.enqueue(new Uint8Array([1]));
              },
              cancel() {
                cancellations++;
              },
            }),
          ),
        )
      );
      const callbackClient = makeClient();
      try {
        const res = await callbackClient.blob(RESOURCE_URL, {}, {
          onProgress: handler,
        });
        assertPolicyFailure(res, 'progress-failure', 500);
        expect(Json.stringify(res).includes('progress-secret')).to.eql(false);
        expect(cancellations).to.eql(1);
      } finally {
        callbackClient.dispose();
        callbackMock.dispose();
      }
    }

    let deadlineCancellations = 0;
    const deadlineMock = WebFixture.Fetch.mock(() =>
      Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new Uint8Array([1]));
            },
            cancel() {
              deadlineCancellations++;
            },
          }),
        ),
      )
    );
    const deadlineClient = makeClient({ timeout: 2 });
    try {
      const res = await deadlineClient.blob(RESOURCE_URL, {}, {
        onProgress() {
          const stop = performance.now() + 15;
          while (performance.now() < stop) {
            // Exercise the post-callback monotonic deadline check.
          }
        },
      });
      assertPolicyFailure(res, 'response-timeout', 408);
      expect(deadlineCancellations).to.eql(1);
    } finally {
      deadlineClient.dispose();
      deadlineMock.dispose();
    }
  });

  it('enforces admitted redirects through the host Fetch runtime', async () => {
    let hits = 0;
    const server = Testing.Http.server((request) => {
      hits++;
      expect(request.headers.get('authorization')).to.eql(null);
      expect(request.headers.get('cookie')).to.eql(null);
      const url = new URL(request.url);
      return url.pathname === '/start'
        ? new Response(null, { status: 302, headers: { location: '/final' } })
        : new Response('done');
    });
    const origin = new URL(server.url.toString()).origin;
    const start = server.url.join('start');
    const final = server.url.join('final');
    const client = Fetch.make({
      policy: policy({ sourceOrigins: [origin] }),
      accessToken: SECRET.authorization,
    });

    try {
      const res = await client.text(start, { headers: { cookie: SECRET.cookie } });
      expect(res.ok).to.eql(true);
      if (res.ok) {
        expect(res.requestedUrl).to.eql(start);
        expect(res.finalUrl).to.eql(final);
        expect(res.data).to.eql('done');
      }
      expect(hits).to.eql(2);
    } finally {
      client.dispose();
      await server.dispose();
    }
  });

  it('admits redirects hop-by-hop with exact final evidence and stable failures', async () => {
    let redirectCancellations = 0;
    const calls: string[] = [];
    const redirect = (location: string) =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new Uint8Array([0]));
          },
          cancel() {
            redirectCancellations++;
          },
        }),
        { status: 302, headers: { location } },
      );
    const mock = WebFixture.Fetch.mock((input) => {
      const url = input instanceof Request ? input.url : String(input);
      calls.push(url);
      const path = new URL(url).pathname;
      if (path === '/start') return Promise.resolve(redirect('/middle'));
      if (path === '/middle') return Promise.resolve(redirect('/final?version=1#ignored'));
      if (path === '/loop') return Promise.resolve(redirect('/loop'));
      if (path === '/limit') return Promise.resolve(redirect('/final'));
      if (path === '/malformed') return Promise.resolve(redirect('http://['));
      if (path === '/escape') return Promise.resolve(redirect('https://escape.test/final'));
      if (path === '/downgrade') return Promise.resolve(redirect('http://example.test/final'));
      if (path === '/transport') return Promise.resolve(redirect('/transport-final'));
      if (path === '/transport-final') return Promise.reject(new Error('TRANSPORT-SECRET'));
      return Promise.resolve(new Response('done'));
    });
    const client = makeClient();
    const limitClient = makeClient({ maxRedirects: 0 });
    const downgradeClient = makeClient({
      sourceOrigins: [ORIGIN, 'http://example.test'],
    });

    try {
      const success = await client.text(`${ORIGIN}/start`);
      expect(success.ok).to.eql(true);
      if (success.ok) {
        expect(success.requestedUrl).to.eql(`${ORIGIN}/start`);
        expect(success.finalUrl).to.eql(`${ORIGIN}/final?version=1`);
      }

      assertPolicyFailure(await client.text(`${ORIGIN}/loop`), 'redirect-loop', 508);
      assertPolicyFailure(
        await limitClient.text(`${ORIGIN}/limit`),
        'redirect-limit',
        508,
      );
      assertPolicyFailure(
        await client.text(`${ORIGIN}/malformed`),
        'redirect-invalid',
        400,
      );
      assertPolicyFailure(await client.text(`${ORIGIN}/escape`), 'source-denied', 403);
      assertPolicyFailure(
        await downgradeClient.text(`${ORIGIN}/downgrade`),
        'redirect-downgrade',
        403,
      );

      const transport = await client.text(`${ORIGIN}/transport`);
      expect(transport.status).to.eql(520);
      expect([...transport.headers]).to.eql([]);
      expect(transport.error?.headers).to.eql({});
      expect(Json.stringify(transport).includes('TRANSPORT-SECRET')).to.eql(false);

      expect(calls.includes('https://escape.test/final')).to.eql(false);
      expect(calls.includes('http://example.test/final')).to.eql(false);
      expect(redirectCancellations).to.eql(8);
    } finally {
      client.dispose();
      limitClient.dispose();
      downgradeClient.dispose();
      mock.dispose();
    }
  });

  it('forwards caller/default headers only to explicit credential origins', async () => {
    const targetOrigin = 'https://target.test';
    const seen: Array<
      { readonly origin: string; readonly headers: Headers; readonly init: RequestInit }
    > = [];
    const mock = WebFixture.Fetch.mock((input, init = {}) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      seen.push({ origin: url.origin, headers: new Headers(init.headers), init });
      return Promise.resolve(
        url.origin === ORIGIN
          ? new Response(null, { status: 302, headers: { location: `${targetOrigin}/final` } })
          : new Response('done'),
      );
    });
    const options = {
      accessToken: SECRET.authorization,
      headers: (event: t.HttpFetch.Mutate.Headers.Args) => event.set('x-default', 'default'),
    };
    const sourceClient = makeClient(
      { sourceOrigins: [ORIGIN, targetOrigin], credentialOrigins: [ORIGIN] },
      options,
    );
    const credentialClient = makeClient(
      {
        sourceOrigins: [ORIGIN, targetOrigin],
        credentialOrigins: [ORIGIN, targetOrigin],
      },
      options,
    );
    const init = { headers: { cookie: SECRET.cookie, 'x-default': 'caller' } };

    try {
      await sourceClient.text(`${ORIGIN}/start`, init);
      await credentialClient.text(`${ORIGIN}/start`, init);

      expect(seen[0].headers.get('authorization')).to.eql(SECRET.authorization);
      expect(seen[0].headers.get('cookie')).to.eql(SECRET.cookie);
      expect(seen[0].headers.get('x-default')).to.eql('caller');
      expect([...seen[1].headers]).to.eql([]);
      expect(seen[2].headers.get('authorization')).to.eql(SECRET.authorization);
      expect(seen[3].headers.get('authorization')).to.eql(SECRET.authorization);
      seen.forEach(({ init: request }) => {
        expect(request.credentials).to.eql('omit');
        expect(request.referrerPolicy).to.eql('no-referrer');
      });
    } finally {
      sourceClient.dispose();
      credentialClient.dispose();
      mock.dispose();
    }
  });

  it('checks exact Blob bytes while retaining transformed text and JSON checksums', async () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255]);
    const text = 'text-🌳';
    const json = { foo: 123 };
    const mock = WebFixture.Fetch.mock((input) => {
      const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
      if (path === '/blob') return Promise.resolve(new Response(bytes));
      if (path === '/text') return Promise.resolve(new Response(text));
      return Promise.resolve(
        new Response(JSON.stringify(json), { headers: { 'content-type': 'application/json' } }),
      );
    });
    const client = makeClient();

    try {
      const blob = await client.blob(`${ORIGIN}/blob`, {}, {
        checksum: Hash.sha256(bytes),
      });
      const textRes = await client.text(`${ORIGIN}/text`, {}, {
        checksum: Hash.sha256(text),
      });
      const jsonRes = await client.json<typeof json>(`${ORIGIN}/json`, {}, {
        checksum: Hash.sha256(json),
      });
      const mismatch = await client.blob(`${ORIGIN}/blob`, {}, {
        checksum: 'sha256-NO',
      });

      expect(blob.ok).to.eql(true);
      expect(textRes.ok).to.eql(true);
      expect(jsonRes.ok).to.eql(true);
      expect(jsonRes.data).to.eql(json);
      expect(mismatch.status).to.eql(412);
      expect(mismatch.error?.policyFailure).to.eql(undefined);
    } finally {
      client.dispose();
      mock.dispose();
    }
  });

  it('does not accept forged or replayed policy identity and preserves cancellation as 499', async () => {
    const sourceClient = makeClient({ timeout: 0 });
    const source = await sourceClient.text(RESOURCE_URL);
    sourceClient.dispose();
    if (source.ok) throw new Error('Expected a source policy failure');

    const clone = { ...source.error };
    Object.getOwnPropertySymbols(source.error).forEach((symbol) => {
      const descriptor = Object.getOwnPropertyDescriptor(source.error, symbol);
      if (descriptor) Object.defineProperty(clone, symbol, descriptor);
    });
    const causes = [clone, source.error];
    let causeIndex = 0;
    const forgedMock = WebFixture.Fetch.mock(() => Promise.reject(causes[causeIndex++]));
    const forgedClient = makeClient();

    try {
      for (const _cause of causes) {
        const forged = await forgedClient.text(RESOURCE_URL);
        expect(forged.status).to.eql(520);
        expect(forged.error?.policyFailure).to.eql(undefined);
      }
    } finally {
      forgedClient.dispose();
      forgedMock.dispose();
    }

    const preAborted = new AbortController();
    let preAbortedCalls = 0;
    preAborted.abort(SECRET.reason);
    const preAbortedMock = WebFixture.Fetch.mock(() => {
      preAbortedCalls++;
      return Promise.resolve(new Response('unexpected'));
    });
    const preAbortedClient = makeClient({ timeout: 0 });
    try {
      const cancelled = await preAbortedClient.text(RESOURCE_URL, {
        signal: preAborted.signal,
      });
      expect(cancelled.status).to.eql(499);
      expect(cancelled.error?.policyFailure).to.eql(undefined);
      expect(preAbortedCalls).to.eql(0);
    } finally {
      preAbortedClient.dispose();
      preAbortedMock.dispose();
    }

    const caller = new AbortController();
    let bodyReady = false;
    const cancelledMock = WebFixture.Fetch.mock((_input, init) =>
      Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              bodyReady = true;
              init?.signal?.addEventListener(
                'abort',
                () => controller.error(init.signal?.reason),
                { once: true },
              );
            },
          }),
        ),
      )
    );
    const cancelledClient = makeClient();

    try {
      const pending = cancelledClient.text(RESOURCE_URL, { signal: caller.signal });
      await Testing.until(() => bodyReady);
      caller.abort(SECRET.reason);
      const cancelled = await pending;
      expect(cancelled.status).to.eql(499);
      expect(cancelled.error?.policyFailure).to.eql(undefined);
      expect(Json.stringify(cancelled).includes(SECRET.reason)).to.eql(false);
    } finally {
      cancelledClient.dispose();
      cancelledMock.dispose();
    }

    let lifecycleBodyReady = false;
    const lifecycleMock = WebFixture.Fetch.mock((_input, init) =>
      Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              lifecycleBodyReady = true;
              init?.signal?.addEventListener(
                'abort',
                () => controller.error(init.signal?.reason),
                { once: true },
              );
            },
          }),
        ),
      )
    );
    const lifecycleClient = makeClient();
    try {
      const pending = lifecycleClient.text(RESOURCE_URL);
      await Testing.until(() => lifecycleBodyReady);
      lifecycleClient.dispose(SECRET.reason);
      const cancelled = await pending;
      expect(cancelled.status).to.eql(499);
      expect(cancelled.error?.policyFailure).to.eql(undefined);
    } finally {
      lifecycleClient.dispose();
      lifecycleMock.dispose();
    }

    const checksumCaller = new AbortController();
    const checksumBytes = new Uint8Array([1, 2, 3]);
    const expected = Hash.sha256(checksumBytes);
    const checksumMock = WebFixture.Fetch.mock(() => Promise.resolve(new Response(checksumBytes)));
    const verifyChecksumAfterAbort: typeof verifyChecksum = (input, expected, errors) => {
      checksumCaller.abort(SECRET.reason);
      return verifyChecksum(input, expected, errors);
    };
    const invoke = createInvokeFetch({
      loadChecksum: () => Promise.resolve({ verifyChecksum: verifyChecksumAfterAbort }),
    });
    const checksumClient = makeFetchWith({ invoke }, { policy: policy() });

    try {
      const cancelled = await checksumClient.blob(
        RESOURCE_URL,
        { signal: checksumCaller.signal },
        { checksum: expected },
      );
      expect(cancelled.status).to.eql(499);
      expect(cancelled.checksum).to.eql(undefined);
      expect(cancelled.error?.policyFailure).to.eql(undefined);
    } finally {
      checksumClient.dispose();
      checksumMock.dispose();
    }
  });

  it('removes caller-signal listeners after policy settlement', async () => {
    const caller = new AbortController();
    const listeners = trackAbortListeners(caller.signal);
    const mock = WebFixture.Fetch.mock(() => Promise.resolve(new Response('done')));
    const client = makeClient();

    try {
      const res = await client.text(RESOURCE_URL, { signal: caller.signal });
      expect(res.ok).to.eql(true);
      expect(listeners.count()).to.eql({ added: 1, removed: 1 });
    } finally {
      client.dispose();
      mock.dispose();
    }
  });

  it('retains admitted ordinary HTTP headers and discards unexpected HEAD bodies', async () => {
    let cancellations = 0;
    let call = 0;
    const responseBody = () =>
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([1]));
        },
        cancel() {
          cancellations++;
        },
      });
    const mock = WebFixture.Fetch.mock(() => {
      call++;
      return Promise.resolve(
        call === 1
          ? new Response(responseBody(), { status: 503, headers: { 'x-evidence': 'retained' } })
          : new Response(responseBody(), { status: 200, headers: { 'x-head': 'retained' } }),
      );
    });
    const client = makeClient();

    try {
      const failure = await client.text(RESOURCE_URL);
      expect(failure.status).to.eql(503);
      expect(failure.headers.get('x-evidence')).to.eql('retained');
      expect(failure.error?.headers['x-evidence']).to.eql('retained');
      expect(failure.error?.policyFailure).to.eql(undefined);

      const head = await client.head(RESOURCE_URL);
      expect(head.ok).to.eql(true);
      expect(head.data).to.eql(undefined);
      expect(cancellations).to.eql(2);
    } finally {
      client.dispose();
      mock.dispose();
    }
  });
});

function trackAbortListeners(signal: AbortSignal) {
  const addEventListener = signal.addEventListener.bind(signal);
  const removeEventListener = signal.removeEventListener.bind(signal);
  let added = 0;
  let removed = 0;

  Object.defineProperty(signal, 'addEventListener', {
    value(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) {
      if (type === 'abort') added++;
      addEventListener(type, listener, options);
    },
  });
  Object.defineProperty(signal, 'removeEventListener', {
    value(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ) {
      if (type === 'abort') removed++;
      removeEventListener(type, listener, options);
    },
  });

  return { count: () => ({ added, removed }) };
}

function assertPolicyFailure(
  response: t.HttpFetch.Response<unknown>,
  kind: t.HttpFetch.ResponsePolicy.FailureKind,
  status: t.HttpStatusCode,
): asserts response is t.HttpFetch.ResponseFailure {
  expect(response.ok).to.eql(false);
  if (response.ok) throw new Error('Expected a failed policy response');
  expect(response.status).to.eql(status);
  expect(response.data).to.eql(undefined);
  expect(response.error.policyFailure).to.eql(kind);
  expect(response.checksum).to.eql(undefined);
  expect('requestedUrl' in response).to.eql(false);
  expect('finalUrl' in response).to.eql(false);
}
