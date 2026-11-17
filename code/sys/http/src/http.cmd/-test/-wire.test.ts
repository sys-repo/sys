import { describe, expect, it, Json, type t, Testing } from '../../-test.ts';
import { monotonicClock } from '../../u/-test/u.fixture.clock.ts';
import { HttpCmd } from '../mod.ts';
import { expectFailure, NS, options, POLICY, request, URL } from './u.fixture.ts';

describe('HttpCmd bounded wire', () => {
  it('admits the complete UTF-8 request at its cap and prevents handler invocation on overflow', async () => {
    const text = Json.stringify({
      kind: 'cmd',
      id: 'req-size',
      ns: NS,
      name: 'fixture.echo',
      payload: { text: '😀' },
    }, 0);
    // Native wire encoding is an independent oracle for the production byte counter.
    const size = (await new Response(text).arrayBuffer()).byteLength;
    let calls = 0;
    const opts = options();
    const cmd = {
      ...opts.cmd,
      handlers: {
        ...opts.cmd.handlers,
        'fixture.echo': () => {
          calls++;
          return { text: 'ok' };
        },
      },
    };

    const overflow = await HttpCmd.handle(request({}, { body: text }), {
      ...opts,
      cmd,
      policy: { ...POLICY, maxBytes: { ...POLICY.maxBytes, request: size - 1 } },
    });
    expect(overflow.status).to.eql(413);
    expect(calls).to.eql(0);
    await overflow.body?.cancel();

    const admitted = await HttpCmd.handle(request({}, { body: text }), {
      ...opts,
      cmd,
      policy: { ...POLICY, maxBytes: { ...POLICY.maxBytes, request: size } },
    });
    expect(admitted.status).to.eql(200);
    expect(calls).to.eql(1);
    await admitted.body?.cancel();
  });

  it('request overflow on the client → prevents dispatch', async () => {
    let calls = 0;
    using client = HttpCmd.client({
      url: URL,
      policy: { ...POLICY, maxBytes: { ...POLICY.maxBytes, request: 1 } },
      fetch: () => {
        calls++;
        throw new Error('must not fetch');
      },
    });
    await expectFailure(() => client.send('x', {}), 'request-too-large', 'not-dispatched');
    expect(calls).to.eql(0);
  });

  it('counts streamed bytes with false or absent Content-Length and cancels overflow once', async () => {
    for (const declared of [undefined, '1', '999999']) {
      let cancelled = 0;
      let chunks = 0;
      const body = new ReadableStream<Uint8Array>({
        pull(controller) {
          chunks++;
          controller.enqueue(chunks < 20 ? new Uint8Array() : new Uint8Array(2000));
        },
        cancel() {
          cancelled++;
          return new Promise<void>(() => {});
        },
      });
      const headers = declared ? { 'content-length': declared } : undefined;
      using client = HttpCmd.client({
        url: URL,
        policy: POLICY,
        fetch: () => Promise.resolve(new Response(body, { status: 500, headers })),
      });
      const error = await expectFailure(() => client.send('x', {}), 'response-too-large');
      expect(error.status).to.eql(500);
      expect(cancelled).to.eql(1);
    }
    let cancelled = 0;
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new Uint8Array(2000));
      },
      cancel() {
        cancelled++;
      },
    });
    const response = await HttpCmd.handle(
      new Request(URL, { method: 'POST', body, headers: { 'content-length': '1' } }),
      options(),
    );
    expect(response.status).to.eql(413);
    expect(await response.text()).to.eql('');
    expect(cancelled).to.eql(1);
  });

  it('request overflow before cleanup abort → retains 413 and releases the reader', async () => {
    const controller = new AbortController();
    let cancelled = 0;
    let calls = 0;
    const body = new ReadableStream<Uint8Array>({
      pull: (stream) => stream.enqueue(new Uint8Array(POLICY.maxBytes.request + 1)),
      cancel() {
        cancelled++;
        controller.abort();
      },
    }, { highWaterMark: 0 });
    const response = await HttpCmd.handle(
      new Request(URL, { method: 'POST', body, signal: controller.signal }),
      {
        policy: POLICY,
        cmd: { handlers: { echo: () => calls++ } },
      },
    );
    expect(response.status).to.eql(413);
    expect(await response.text()).to.eql('');
    expect(calls).to.eql(0);
    expect(cancelled).to.eql(1);
    expect(controller.signal.aborted).to.eql(true);
    expect(body.locked).to.eql(false);
  });

  it('request overflow before cleanup deadline → retains 413 and releases the reader', async () => {
    using clock = monotonicClock();
    let cancelled = 0;
    let calls = 0;
    const body = new ReadableStream<Uint8Array>({
      pull: (stream) => stream.enqueue(new Uint8Array(POLICY.maxBytes.request + 1)),
      cancel() {
        cancelled++;
        clock.set(POLICY.timeout);
      },
    }, { highWaterMark: 0 });
    const response = await HttpCmd.handle(
      new Request(URL, { method: 'POST', body }),
      {
        policy: POLICY,
        cmd: { handlers: { echo: () => calls++ } },
      },
    );
    expect(response.status).to.eql(413);
    expect(await response.text()).to.eql('');
    expect(calls).to.eql(0);
    expect(cancelled).to.eql(1);
    expect(body.locked).to.eql(false);
  });

  it('request abort before oversized chunk → retains 408 through cleanup deadline', async () => {
    using clock = monotonicClock();
    const controller = new AbortController();
    let cancelled = 0;
    let calls = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(stream) {
        controller.abort();
        stream.enqueue(new Uint8Array(POLICY.maxBytes.request + 1));
      },
      cancel() {
        cancelled++;
        clock.set(POLICY.timeout);
      },
    }, { highWaterMark: 0 });
    const response = await HttpCmd.handle(
      new Request(URL, { method: 'POST', body, signal: controller.signal }),
      {
        policy: POLICY,
        cmd: { handlers: { echo: () => calls++ } },
      },
    );
    expect(response.status).to.eql(408);
    expect(await response.text()).to.eql('');
    expect(calls).to.eql(0);
    expect(cancelled).to.eql(1);
    expect(body.locked).to.eql(false);
  });

  it('request deadline before oversized chunk → retains 504 through cleanup abort', async () => {
    using clock = monotonicClock();
    const controller = new AbortController();
    let cancelled = 0;
    let calls = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(stream) {
        clock.set(POLICY.timeout);
        stream.enqueue(new Uint8Array(POLICY.maxBytes.request + 1));
      },
      cancel() {
        cancelled++;
        controller.abort();
      },
    }, { highWaterMark: 0 });
    const response = await HttpCmd.handle(
      new Request(URL, { method: 'POST', body, signal: controller.signal }),
      {
        policy: POLICY,
        cmd: { handlers: { echo: () => calls++ } },
      },
    );
    expect(response.status).to.eql(504);
    expect(await response.text()).to.eql('');
    expect(calls).to.eql(0);
    expect(cancelled).to.eql(1);
    expect(controller.signal.aborted).to.eql(true);
    expect(body.locked).to.eql(false);
  });

  it('bounds success, fallback, and serialization failures on the server', async () => {
    const opts = options();
    for (
      const payload of ['x'.repeat(5000), BigInt(1), {
        toJSON() {
          throw new Error('secret');
        },
      }]
    ) {
      const response = await HttpCmd.handle(request(), {
        ...opts,
        cmd: {
          ...opts.cmd,
          handlers: { ...opts.cmd.handlers, 'fixture.echo': () => payload as never },
        },
      });
      expect(response.status).to.eql(500);
      expect((await response.json()).error).to.eql('HTTP command failed.');
    }
    const response = await HttpCmd.handle(
      request(),
      options({ policy: { ...POLICY, maxBytes: { ...POLICY.maxBytes, response: 1 } } }),
    );
    expect(response.status).to.eql(500);
    expect(response.headers.get('cache-control')).to.eql('no-store');
    expect(await response.text()).to.eql('');
  });

  it('accepts an exactly capped response and rejects one extra UTF-8 byte', async () => {
    const expected = {
      kind: 'cmd:result',
      id: 'req-fixture',
      ns: NS,
      name: 'fixture.echo',
      payload: { text: '😀' },
    };
    const bytes = (await new Response(Json.stringify(expected, 0)).arrayBuffer()).byteLength;

    const admitted = await HttpCmd.handle(
      request({ payload: { text: '😀' } }),
      options({ policy: { ...POLICY, maxBytes: { ...POLICY.maxBytes, response: bytes } } }),
    );
    expect(admitted.status).to.eql(200);
    const body = await admitted.arrayBuffer();
    expect(body.byteLength).to.eql(bytes);
    expect(await new Response(body).json()).to.eql(expected);

    const overflow = await HttpCmd.handle(
      request({ payload: { text: '😀' } }),
      options({ policy: { ...POLICY, maxBytes: { ...POLICY.maxBytes, response: bytes - 1 } } }),
    );
    expect(overflow.status).to.eql(500);
    expect((await overflow.arrayBuffer()).byteLength).to.be.at.most(bytes - 1);
  });

  it('rejects true encoding failures before dispatch but retains canonical repeated-reference semantics', async () => {
    let calls = 0;
    using client = HttpCmd.client({
      url: URL,
      policy: POLICY,
      fetch: (_input, init) => {
        calls++;
        return Promise.resolve(reply(init));
      },
    });
    for (
      const payload of [BigInt(1), {
        toJSON() {
          throw new Error('secret');
        },
      }]
    ) {
      await expectFailure(() => client.send('x', payload), 'invalid-request', 'not-dispatched');
    }
    expect(calls).to.eql(0);
    const shared = { value: 1 };
    const cycle: { self?: unknown } = {};
    cycle.self = cycle;
    expect(await client.send('x', { a: shared, b: shared, cycle })).to.eql({
      a: { value: 1 },
      b: '[Circular]',
      cycle: { self: '[Circular]' },
    });
    expect(calls).to.eql(1);
  });

  it('uses a correlated result rather than non-redirect status or Content-Type as authority', async () => {
    for (const status of [200, 400, 401, 403, 404, 500, 504]) {
      using client = HttpCmd.client({
        url: URL,
        policy: POLICY,
        fetch: (_input, init) => Promise.resolve(reply(init, {}, status)),
      });
      expect(await client.send('x', { ok: true })).to.eql({ ok: true });
    }
  });

  it('correlated remote errors → rejects without copying remote diagnostic data', async () => {
    for (
      const patch of [{ error: '' }, {
        error: 'secret',
        errorCause: { secret: true },
        payload: { ok: true },
      }]
    ) {
      using client = HttpCmd.client({
        url: URL,
        policy: POLICY,
        fetch: (_input, init) => Promise.resolve(reply(init, patch, 504)),
      });
      const error = await expectFailure(() => client.send('x', {}), 'remote');
      expect(error.status).to.eql(504);
    }
  });

  it('invalid result correlation or envelope shape → rejects as protocol failure', async () => {
    for (
      const patch of [{ id: 'req-wrong' }, { name: 'wrong' }, { ns: 'wrong' }, { error: null }, {
        kind: 'other',
      }]
    ) {
      using client = HttpCmd.client({
        url: URL,
        policy: POLICY,
        fetch: (_input, init) => Promise.resolve(reply(init, patch)),
      });
      await expectFailure(() => client.send('x', {}), 'protocol');
    }
  });

  it('accepts an omitted payload in a correlated success envelope', async () => {
    using client = HttpCmd.client({
      url: URL,
      policy: POLICY,
      fetch: (_input, init) => Promise.resolve(reply(init, { payload: undefined })),
    });
    expect(await client.send('x', undefined)).to.eql(undefined);
  });

  it('rejects malformed UTF-8 on both directions rather than changing data', async () => {
    const bytes = new Uint8Array([0x22, 0xff, 0x22]);
    const response = await HttpCmd.handle(
      new Request(URL, { method: 'POST', body: bytes }),
      options(),
    );
    expect(response.status).to.eql(400);
    await response.body?.cancel();
    using client = HttpCmd.client({
      url: URL,
      policy: POLICY,
      fetch: () => Promise.resolve(new Response(bytes)),
    });
    await expectFailure(() => client.send('x', {}), 'protocol');
  });

  it('classifies opaque, error, and opaque-redirect responses', async () => {
    const cases = [
      { type: 'opaque', kind: 'network' },
      { type: 'error', kind: 'network' },
      { type: 'opaqueredirect', kind: 'redirect' },
    ] as const;
    for (const { type, kind } of cases) {
      const response = new Response(null);
      Object.defineProperty(response, 'type', { value: type });
      using client = HttpCmd.client({
        url: URL,
        policy: POLICY,
        fetch: () => Promise.resolve(response),
      });
      await expectFailure(() => client.send('x', {}), kind);
    }
  });

  it('classifies body failures without copying exception details', async () => {
    const broken = () =>
      new ReadableStream<Uint8Array>({
        pull() {
          throw new Error('body-secret');
        },
      });
    {
      using client = HttpCmd.client({
        url: URL,
        policy: POLICY,
        fetch: () => Promise.resolve(new Response(broken(), { status: 500 })),
      });
      await expectFailure(() => client.send('x', {}), 'network');
    }
    const response = await HttpCmd.handle(
      new Request(URL, { method: 'POST', body: broken() }),
      options(),
    );
    expect(response.status).to.eql(400);
    expect(await response.text()).to.eql('');
  });

  it('refuses real HTTP redirects without reaching a second endpoint', async () => {
    const paths: string[] = [];
    const server = Testing.Http.server((request) => {
      const path = new globalThis.URL(request.url).pathname;
      paths.push(path);
      return new Response('secret redirect', { status: 302, headers: { location: '/target' } });
    });
    try {
      using client = HttpCmd.client({ url: `${server.url.toURL().origin}/cmd`, policy: POLICY });
      const error = await expectFailure(() => client.send('x', {}), 'redirect');
      expect(error.status).to.eql(302);
      expect(paths).to.eql(['/cmd']);
    } finally {
      await server.dispose();
    }
  });
});

function reply(init: RequestInit | undefined, patch: object = {}, status = 200): Response {
  const msg = Json.parse<t.Cmd.Wire.Request>(String(init?.body))!;
  return new Response(Json.stringify({ ...msg, kind: 'cmd:result', ...patch }, 0), {
    status,
    headers: { 'content-type': 'text/plain' },
  });
}
