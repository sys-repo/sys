import { WebFixture } from '@sys/testing/web';
import { describe, expect, it, Json, type t, Testing, Url } from '../../../-test.ts';
import { Fetch } from '../mod.ts';

const SENTINEL = {
  apiKey: 'api-key-SECRET',
  bearerCaller: 'Bearer CALLER-SECRET',
  bearerDefault: 'Bearer DEFAULT-SECRET',
  cookie: 'session=COOKIE-SECRET',
  fragment: 'fragment-SECRET',
  password: 'password-SECRET',
  query: 'query-SECRET',
  username: 'username-SECRET',
} as const;

describe('Http.Fetch: request authority', () => {
  it('applies caller headers once with case-insensitive precedence', async () => {
    const server = Testing.Http.server((req) => {
      expect(req.headers.get('authorization')).to.eql(SENTINEL.bearerCaller);
      expect(req.headers.get('x-default')).to.eql('caller');
      expect(req.headers.get('content-type')).to.eql('application/x-caller');
      expect(req.headers.get('cookie')).to.eql(SENTINEL.cookie);
      expect(req.headers.get('x-api-key')).to.eql(SENTINEL.apiKey);

      return new Response('no', {
        status: 418,
        statusText: 'Teapot',
        headers: { 'x-response-proof': 'response' },
      });
    });

    const input = new URL(server.url.toString());
    input.searchParams.set('token', SENTINEL.query);
    input.hash = SENTINEL.fragment;

    const client = Fetch.make({
      accessToken: SENTINEL.bearerDefault,
      contentTypePolicy: 'always',
      headers(e) {
        e.set('X-Default', 'default');
        e.set('Content-Type', 'application/x-default');
      },
    });
    const res = await client.text(input.href, {
      headers: {
        authorization: SENTINEL.bearerCaller,
        'content-type': 'application/x-caller',
        Cookie: SENTINEL.cookie,
        'x-api-key': SENTINEL.apiKey,
        'x-default': 'caller',
      },
    });

    expect(res.ok).to.eql(false);
    expect(res.url).to.eql(Url.toCanonical(input).href);
    expect(res.headers.get('x-response-proof')).to.eql('response');
    expect(res.error?.headers['x-response-proof']).to.eql('response');
    expect(res.error?.headers.authorization).to.eql(undefined);
    expect(res.error?.headers.cookie).to.eql(undefined);
    expect(res.error?.headers['x-api-key']).to.eql(undefined);
    assertCredentialSafe(res, [
      SENTINEL.bearerCaller,
      SENTINEL.bearerDefault,
      SENTINEL.cookie,
      SENTINEL.apiKey,
      SENTINEL.query,
      SENTINEL.fragment,
    ]);

    client.dispose();
    await server.dispose();
  });

  it('inspects and snapshots default headers case-insensitively', () => {
    let callbackAuthorization = '';
    const client = Fetch.make({
      accessToken: SENTINEL.bearerDefault,
      headers(e) {
        callbackAuthorization = e.get('authorization');
        e.set('X-Mixed-Case', 'safe');
        expect(e.get('x-mixed-case')).to.eql('safe');
      },
    });

    const snapshot = client.headers as Record<string, string>;
    expect(callbackAuthorization).to.eql(SENTINEL.bearerDefault);
    expect(snapshot.authorization).to.eql(SENTINEL.bearerDefault);
    expect(snapshot['x-mixed-case']).to.eql('safe');
    expect(client.header('AUTHORIZATION')).to.eql(SENTINEL.bearerDefault);
    expect(client.header('X-MIXED-CASE')).to.eql('safe');

    snapshot.authorization = 'Bearer MUTATED';
    snapshot['x-mixed-case'] = 'mutated';
    expect(client.header('authorization')).to.eql(SENTINEL.bearerDefault);
    expect(client.header('x-mixed-case')).to.eql('safe');

    client.dispose();
  });

  it('keeps response headers on decode failure without leaking request authority', async () => {
    const server = Testing.Http.server(
      () =>
        new Response('not-json', {
          status: 200,
          headers: { 'content-type': 'application/json', 'x-response-proof': 'decode' },
        }),
    );
    const input = new URL(server.url.toString());
    input.searchParams.set('token', SENTINEL.query);
    input.hash = SENTINEL.fragment;

    const client = Fetch.make({ accessToken: SENTINEL.bearerDefault });
    const res = await client.json(input.href, {
      headers: { Cookie: SENTINEL.cookie, 'X-API-Key': SENTINEL.apiKey },
    });

    expect(res.ok).to.eql(false);
    expect(res.status).to.eql(520);
    expect(res.url).to.eql(Url.toCanonical(input).href);
    expect(res.error?.headers['x-response-proof']).to.eql('decode');
    expect(res.error?.headers.authorization).to.eql(undefined);
    expect(res.error?.headers.cookie).to.eql(undefined);
    expect(res.error?.headers['x-api-key']).to.eql(undefined);
    assertCredentialSafe(res, [
      SENTINEL.bearerDefault,
      SENTINEL.cookie,
      SENTINEL.apiKey,
      SENTINEL.query,
      SENTINEL.fragment,
    ]);

    client.dispose();
    await server.dispose();
  });

  it('sanitizes transport failures without retaining the raw cause', async () => {
    const input = new URL('http://127.0.0.1:1/private');
    input.username = SENTINEL.username;
    input.password = SENTINEL.password;
    input.searchParams.set('token', SENTINEL.query);
    input.hash = SENTINEL.fragment;

    const client = Fetch.make({ accessToken: SENTINEL.bearerDefault });
    const res = await client.text(input.href, {
      headers: { Cookie: SENTINEL.cookie, 'X-API-Key': SENTINEL.apiKey },
    });

    expect(res.ok).to.eql(false);
    expect(res.status).to.eql(520);
    expect(res.url).to.eql(Url.toCanonical(input).href);
    expect(res.error?.headers).to.eql({});
    expect(res.error?.cause?.cause).to.eql(undefined);
    assertCredentialSafe(res, [
      SENTINEL.apiKey,
      SENTINEL.bearerCaller,
      SENTINEL.bearerDefault,
      SENTINEL.cookie,
      SENTINEL.fragment,
      SENTINEL.password,
      SENTINEL.query,
      SENTINEL.username,
    ]);

    client.dispose();
  });
});

describe('Http.Fetch.byteSize: request authority', () => {
  it('does not inherit an injected client and uses credential-omitting manual probes', async () => {
    const calls: RequestInit[] = [];
    const nativeFetch = globalThis.fetch;
    const trackedFetch: typeof globalThis.fetch = async (input, init) => {
      calls.push(init ?? {});
      return await nativeFetch(input, init);
    };
    const mock = WebFixture.Fetch.mock(trackedFetch);

    const server = Testing.Http.server((req) => {
      expect(req.headers.get('authorization')).to.eql(null);
      expect(req.headers.get('cookie')).to.eql(null);
      expect(req.headers.get('x-api-key')).to.eql(null);
      expect(req.headers.get('referer')).to.eql(null);

      if (req.method === 'HEAD') return new Response(null, { status: 405 });
      expect(req.headers.get('range')).to.eql('bytes=0-0');
      return new Response(new Uint8Array([0]), {
        status: 206,
        headers: { 'content-range': 'bytes 0-0/64' },
      });
    });

    const injected = Fetch.make({
      accessToken: SENTINEL.bearerDefault,
      headers: (e) => e.set('Cookie', SENTINEL.cookie).set('X-API-Key', SENTINEL.apiKey),
    });

    try {
      type RuntimeProbe = (
        url: t.StringUrl,
        input?: unknown,
      ) => Promise<t.HttpFetch.ByteSize.Result>;
      const runtimeProbe = Fetch.byteSize as unknown as RuntimeProbe;
      const res = await runtimeProbe(server.url.toString(), injected);

      expect(res).to.eql({ url: server.url.toString(), bytes: 64, from: 'range' });
      expect(injected.disposed).to.eql(false);
      expect(calls.length).to.eql(2);
      calls.forEach((init) => {
        expect(init.credentials).to.eql('omit');
        expect(init.redirect).to.eql('manual');
        expect(init.referrerPolicy).to.eql('no-referrer');
      });
    } finally {
      mock.dispose();
      injected.dispose();
      await server.dispose();
    }
  });

  it('does not follow redirects', async () => {
    let sourceHits = 0;
    let targetHits = 0;
    const server = Testing.Http.server((req) => {
      const url = new URL(req.url);
      if (url.pathname === '/target') {
        targetHits++;
        return new Response(null, { status: 200, headers: { 'content-length': '999' } });
      }

      sourceHits++;
      return new Response(null, { status: 302, headers: { location: '/target' } });
    });

    const res = await Fetch.byteSize(server.url.toString());
    expect(res).to.eql({ url: server.url.toString(), from: 'unknown' });
    expect(sourceHits).to.eql(2);
    expect(targetHits).to.eql(0);

    await server.dispose();
  });

  it('cancels the range response body', async () => {
    let calls = 0;
    let cancellations = 0;
    const mock = WebFixture.Fetch.mock((_input, init) => {
      calls++;
      if (init?.method === 'HEAD') {
        return Promise.resolve(new Response(null, { status: 405 }));
      }

      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([0]));
        },
        cancel() {
          cancellations++;
        },
      });
      return Promise.resolve(
        new Response(body, {
          status: 206,
          headers: { 'content-range': 'bytes 0-0/64' },
        }),
      );
    });

    try {
      const url = 'https://example.test/resource';
      const res = await Fetch.byteSize(url);
      expect(res).to.eql({ url, bytes: 64, from: 'range' });
      expect(calls).to.eql(2);
      expect(cancellations).to.eql(1);
    } finally {
      mock.dispose();
    }
  });
});

function assertCredentialSafe(res: t.FetchResponse<unknown>, sentinels: readonly string[]) {
  const report = Json.stringify({
    url: res.url,
    message: res.error?.message,
    cause: res.error?.cause?.message,
    nested: res.error?.cause?.cause?.message,
    headers: res.error?.headers,
  });

  sentinels.forEach((sentinel) => {
    expect(report.includes(sentinel)).to.eql(false);
  });
}
