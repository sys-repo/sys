import { WebFixture } from '@sys/testing/web';
import { describe, expect, it, Json, Schedule, type t, Testing } from '../../../-test.ts';
import { Fetch } from '../mod.ts';
import { fetchOptions } from './u.fixture.ts';

const URL = 'https://example.test/resource';
const ORIGIN = 'https://example.test';
const makeClient = () => Fetch.make(fetchOptions([ORIGIN]));
const REASON = {
  caller: 'caller-abort-SECRET',
  lifecycle: 'lifecycle-abort-SECRET',
  later: 'later-abort-SECRET',
} as const;

describe('Http.Fetch: cancellation authority', () => {
  it('caller abort → canonical path-safe 499 and first reason wins internally', async () => {
    const caller = new AbortController();
    const client = makeClient();
    let fetchStarted = false;
    let observedReason: unknown;

    const mock = WebFixture.Fetch.mock((_input, init) => {
      fetchStarted = true;
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        const onAbort = () => {
          observedReason = signal?.reason;
          reject(signal?.reason);
        };

        if (signal?.aborted) onAbort();
        else signal?.addEventListener('abort', onAbort, { once: true });
      });
    });

    try {
      const promise = client.text(URL, { signal: caller.signal });
      await Testing.until(() => fetchStarted);
      caller.abort(REASON.caller);
      client.dispose(REASON.later);

      const res = await promise;
      assertCancelled(res, REASON.caller, REASON.later);
      expect(observedReason).to.eql(REASON.caller);
      expect('controller' in client).to.eql(false);
    } finally {
      mock.dispose();
      client.dispose();
    }
  });

  it('lifecycle abort → canonical path-safe 499', async () => {
    const client = makeClient();

    const mock = WebFixture.Fetch.mock((_input, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        const onAbort = () => reject(signal?.reason);
        if (signal?.aborted) onAbort();
        else signal?.addEventListener('abort', onAbort, { once: true });
      });
    });

    try {
      const promise = client.text(URL);
      client.dispose(REASON.lifecycle);
      const res = await promise;
      assertCancelled(res, REASON.lifecycle);
    } finally {
      mock.dispose();
      client.dispose();
    }
  });

  it('pre-aborted caller signal → canonical path-safe 499', async () => {
    const caller = new AbortController();
    const client = makeClient();
    caller.abort(REASON.caller);

    const mock = WebFixture.Fetch.mock((_input, init) => {
      const signal = init?.signal;
      return signal?.aborted
        ? Promise.reject(signal.reason)
        : Promise.resolve(new Response('unexpected'));
    });

    try {
      const res = await client.text(URL, { signal: caller.signal });
      assertCancelled(res, REASON.caller);
    } finally {
      mock.dispose();
      client.dispose();
    }
  });

  it('abort during body consumption → canonical path-safe 499', async () => {
    const caller = new AbortController();
    const client = makeClient();
    let bodyReady = false;

    const mock = WebFixture.Fetch.mock((_input, init) => {
      const signal = init?.signal;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          bodyReady = true;
          signal?.addEventListener('abort', () => controller.error(signal.reason), { once: true });
        },
      });
      return Promise.resolve(new Response(body));
    });

    try {
      const promise = client.text(URL, { signal: caller.signal });
      await Testing.until(() => bodyReady);
      caller.abort(REASON.caller);

      const res = await promise;
      assertCancelled(res, REASON.caller);
    } finally {
      mock.dispose();
      client.dispose();
    }
  });

  it('abort before checksum verification → canonical path-safe 499', async () => {
    const nativeBlob = Response.prototype.blob;
    const caller = new AbortController();
    const client = makeClient();
    let decodeReady = false;

    const mock = WebFixture.Fetch.mock(() =>
      Promise.resolve(new Response(new Uint8Array([0, 1, 2])))
    );
    Response.prototype.blob = function (this: Response) {
      decodeReady = true;
      return new Promise((resolve) => {
        const finish = () => resolve(nativeBlob.call(this));
        if (caller.signal.aborted) finish();
        else caller.signal.addEventListener('abort', finish, { once: true });
      });
    };

    try {
      const promise = client.blob(
        URL,
        { signal: caller.signal },
        { checksum: 'sha256-cancel-before-verification' },
      );
      await Testing.until(() => decodeReady);
      caller.abort(REASON.caller);

      const res = await promise;
      assertCancelled(res, REASON.caller);
    } finally {
      mock.dispose();
      Response.prototype.blob = nativeBlob;
      client.dispose();
    }
  });

  it('removes composed-signal listeners after successful settlement', async () => {
    const caller = new AbortController();
    const client = makeClient();
    const listeners = trackAbortListeners(caller.signal);
    const mock = WebFixture.Fetch.mock(() => Promise.resolve(new Response('done')));

    try {
      const res = await client.text(URL, { signal: caller.signal });
      expect(res.ok).to.eql(true);
      expect(listeners.count()).to.eql({ added: 1, removed: 1 });
    } finally {
      mock.dispose();
      client.dispose();
    }
  });

  it('removes composed-signal listeners after cancelled settlement', async () => {
    const caller = new AbortController();
    const client = makeClient();
    const listeners = trackAbortListeners(caller.signal);

    const mock = WebFixture.Fetch.mock((_input, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        const onAbort = () => reject(signal?.reason);
        if (signal?.aborted) onAbort();
        else signal?.addEventListener('abort', onAbort, { once: true });
      });
    });

    try {
      const promise = client.text(URL, { signal: caller.signal });
      caller.abort(REASON.caller);

      const res = await promise;
      assertCancelled(res, REASON.caller);
      expect(listeners.count()).to.eql({ added: 1, removed: 1 });
    } finally {
      mock.dispose();
      client.dispose();
    }
  });
});

describe('Http.Fetch.byteSize: cancellation authority', () => {
  it('pre-aborted lifecycle → cancelled without requests', async () => {
    const caller = new AbortController();
    let calls = 0;
    caller.abort(REASON.caller);
    const mock = WebFixture.Fetch.mock(() => {
      calls++;
      return Promise.resolve(new Response('unexpected'));
    });

    try {
      const res = await Fetch.byteSize(URL, caller.signal);
      expect(res).to.eql({ url: URL, from: 'unknown', cancelled: true });
      expect(calls).to.eql(0);
    } finally {
      mock.dispose();
    }
  });

  it('abort between HEAD and range → cancelled without fallback', async () => {
    const caller = new AbortController();
    let calls = 0;

    const mock = WebFixture.Fetch.mock((_input, init) => {
      calls++;
      if (init?.method === 'HEAD') {
        Schedule.micro(() => caller.abort(REASON.caller));
        return Promise.resolve(new Response(null, { status: 405 }));
      }
      return Promise.resolve(
        new Response(new Uint8Array([0]), {
          status: 206,
          headers: { 'content-range': 'bytes 0-0/64' },
        }),
      );
    });

    try {
      const res = await Fetch.byteSize(URL, caller.signal);
      expect(res).to.eql({ url: URL, from: 'unknown', cancelled: true });
      expect(calls).to.eql(1);
    } finally {
      mock.dispose();
    }
  });

  it('abort during range probe → cancelled and shares lifecycle signal', async () => {
    const caller = new AbortController();
    let calls = 0;

    const mock = WebFixture.Fetch.mock((_input, init) => {
      calls++;
      if (init?.method === 'HEAD') {
        return Promise.resolve(new Response(null, { status: 405 }));
      }

      const signal = init?.signal;
      if (!signal) {
        return Promise.resolve(
          new Response(new Uint8Array([0]), {
            status: 206,
            headers: { 'content-range': 'bytes 0-0/64' },
          }),
        );
      }

      return new Promise((_resolve, reject) => {
        const onAbort = () => reject(signal.reason);
        if (signal.aborted) onAbort();
        else signal.addEventListener('abort', onAbort, { once: true });
      });
    });

    try {
      const promise = Fetch.byteSize(URL, caller.signal);
      await Testing.until(() => calls === 2);
      caller.abort(REASON.caller);

      const res = await promise;
      expect(res).to.eql({ url: URL, from: 'unknown', cancelled: true });
      expect(calls).to.eql(2);
    } finally {
      mock.dispose();
    }
  });

  it('ordinary unknown result remains distinct from cancellation', async () => {
    const mock = WebFixture.Fetch.mock(() => Promise.resolve(new Response(null, { status: 404 })));

    try {
      const res = await Fetch.byteSize(URL);
      expect(res).to.eql({ url: URL, from: 'unknown' });
    } finally {
      mock.dispose();
    }
  });

  it('disposes operation and client lifecycle bridges exactly once', async () => {
    const caller = new AbortController();
    const listeners = trackStructuralAbortSignal(caller.signal);
    const mock = WebFixture.Fetch.mock(() => {
      return Promise.resolve(
        new Response(null, { status: 200, headers: { 'content-length': '64' } }),
      );
    });

    try {
      const res = await Fetch.byteSize(URL, listeners.signal);
      expect(res).to.eql({ url: URL, bytes: 64, from: 'head' });
      expect(listeners.count()).to.eql({ added: 1, removed: 1 });
    } finally {
      mock.dispose();
    }
  });

  it('disposes operation and client lifecycle bridges after cancellation', async () => {
    const caller = new AbortController();
    const listeners = trackStructuralAbortSignal(caller.signal);
    let rejectFetch: (reason?: unknown) => void = () => {};
    let requestStarted = false;

    const mock = WebFixture.Fetch.mock(() => {
      requestStarted = true;
      return new Promise((_resolve, reject) => (rejectFetch = reject));
    });

    try {
      const promise = Fetch.byteSize(URL, listeners.signal);
      await Testing.until(() => requestStarted);
      caller.abort(REASON.caller);
      rejectFetch(REASON.caller);

      const res = await promise;
      expect(res).to.eql({ url: URL, from: 'unknown', cancelled: true });
      expect(listeners.count()).to.eql({ added: 1, removed: 1 });
    } finally {
      mock.dispose();
    }
  });
});

function assertCancelled(res: t.HttpFetch.Response<unknown>, ...reasons: string[]) {
  expect(res.ok).to.eql(false);
  if (res.ok) throw new Error('Expected a cancelled Fetch response');
  expect(res.status).to.eql(499);
  expect(res.statusText).to.eql('Fetch operation cancelled before completing');
  expect(res.data).to.eql(undefined);
  expect(res.checksum).to.eql(undefined);
  expect(res.error?.name).to.eql('HttpError');
  expect(res.error?.cause?.cause).to.eql(undefined);

  const report = Json.stringify({
    url: res.url,
    message: res.error?.message,
    cause: res.error?.cause?.message,
    nested: res.error?.cause?.cause?.message,
    headers: res.error?.headers,
  });
  reasons.forEach((reason) => expect(report.includes(reason)).to.eql(false));
}

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

function trackStructuralAbortSignal(source: AbortSignal) {
  const addEventListener = source.addEventListener.bind(source);
  const removeEventListener = source.removeEventListener.bind(source);
  let added = 0;
  let removed = 0;
  const signal = {
    get aborted() {
      return source.aborted;
    },
    get reason() {
      return source.reason;
    },
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) {
      if (type === 'abort') added++;
      addEventListener(type, listener, options);
    },
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ) {
      if (type === 'abort') removed++;
      removeEventListener(type, listener, options);
    },
  } as AbortSignal;

  return { signal, count: () => ({ added, removed }) };
}
