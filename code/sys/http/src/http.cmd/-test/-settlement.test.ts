import { describe, expect, it, Schedule } from '../../-test.ts';
import { HttpCmd } from '../mod.ts';
import { expectFailure, fetchFor, NS, options, POLICY, request, URL } from './u.fixture.ts';

describe('HttpCmd settlement ownership', () => {
  it('bounds ignored fetch cancellation and cancels a late response body', async () => {
    const pending = Promise.withResolvers<Response>();
    const cancelled = Promise.withResolvers<void>();
    let calls = 0;
    const client = HttpCmd.client({
      url: URL,
      policy: { ...POLICY, timeout: 10 },
      fetch: () => {
        calls++;
        return pending.promise;
      },
    });
    try {
      await expectFailure(() => client.send('x', {}), 'timeout');
      pending.resolve(
        new Response(
          new ReadableStream({
            cancel() {
              cancelled.resolve();
            },
          }),
        ),
      );
      await cancelled.promise;
      expect(calls).to.eql(1);
    } finally {
      client.dispose();
    }
  });

  it('bounds ignored handler cancellation without serializing late results or promising rollback', async () => {
    const pending = Promise.withResolvers<{ text: string }>();
    let serialized = 0;
    let committed = 0;
    const opts = options({ policy: { ...POLICY, timeout: 10 } });
    const response = await HttpCmd.handle(request(), {
      ...opts,
      cmd: {
        ...opts.cmd,
        handlers: {
          ...opts.cmd.handlers,
          'fixture.echo': async () => {
            const value = await pending.promise;
            committed++;
            return value;
          },
        },
      },
    });
    expect(response.status).to.eql(504);
    expect((await response.json()).error).to.eql('HTTP command failed.');
    expect(committed).to.eql(0);
    pending.resolve({
      text: 'late',
      toJSON() {
        serialized++;
        return {};
      },
    } as { text: string });
    await Schedule.micro();
    await Schedule.micro();
    expect(committed).to.eql(1);
    expect(serialized).to.eql(0);
  });

  it('distinguishes prevented dispatch from response loss after a commit without retry', async () => {
    let committed = 0;
    let fetches = 0;
    const opts = options();
    const handler = HttpCmd.handler({
      ...opts,
      cmd: {
        ...opts.cmd,
        handlers: {
          ...opts.cmd.handlers,
          'fixture.echo': () => {
            committed++;
            return { text: 'committed' };
          },
        },
      },
    });
    const client = HttpCmd.client({
      url: URL,
      ns: NS,
      policy: POLICY,
      fetch: async (input, init) => {
        fetches++;
        const response = await handler(new Request(input, init));
        await response.body?.cancel();
        throw new Error('response-lost-secret');
      },
    });
    try {
      const controller = new AbortController();
      controller.abort('secret-reason');
      await expectFailure(
        () => client.send('fixture.echo', {}, { signal: controller.signal }),
        'cancelled',
        'not-dispatched',
      );
      expect(committed).to.eql(0);
      expect(fetches).to.eql(0);
      await expectFailure(() => client.send('fixture.echo', {}), 'network');
      expect(committed).to.eql(1);
      expect(fetches).to.eql(1);
    } finally {
      client.dispose();
    }
  });

  it('does not invoke a handler for an already-aborted request', async () => {
    let calls = 0;
    const opts = options();
    const signal = new AbortController();
    signal.abort('secret');
    const response = await HttpCmd.handle(new Request(request(), { signal: signal.signal }), {
      ...opts,
      cmd: {
        ...opts.cmd,
        handlers: {
          ...opts.cmd.handlers,
          'fixture.echo': () => {
            calls++;
            return { text: 'wrong' };
          },
        },
      },
    });
    expect(response.status).to.eql(408);
    expect(await response.text()).to.eql('');
    expect(calls).to.eql(0);
  });

  it('settles an aborted in-flight handler as 408 even when the handler ignores abort', async () => {
    const started = Promise.withResolvers<AbortSignal>();
    const pending = Promise.withResolvers<{ text: string }>();
    const controller = new AbortController();
    const opts = options();
    const result = HttpCmd.handle(new Request(request(), { signal: controller.signal }), {
      ...opts,
      cmd: {
        ...opts.cmd,
        handlers: {
          ...opts.cmd.handlers,
          'fixture.echo': (_payload, ctx) => {
            started.resolve(ctx.signal);
            return pending.promise;
          },
        },
      },
    });
    const signal = await started.promise;
    controller.abort('private-abort-reason');
    const response = await result;
    expect(signal.aborted).to.eql(true);
    expect(response.status).to.eql(408);
    expect((await response.json()).error).to.eql('HTTP command failed.');
    pending.resolve({ text: 'late' });
  });

  it('settles body stalls without waiting for hanging stream cancellation', async () => {
    let cancelled = 0;
    const body = () =>
      new ReadableStream<Uint8Array>({
        cancel() {
          cancelled++;
          return new Promise<void>(() => {});
        },
      });
    const policy = { ...POLICY, timeout: 10 };
    const client = HttpCmd.client({
      url: URL,
      policy,
      fetch: () => Promise.resolve(new Response(body())),
    });
    try {
      await expectFailure(() => client.send('x', {}), 'timeout');
    } finally {
      client.dispose();
    }
    const response = await HttpCmd.handle(
      new Request(URL, { method: 'POST', body: body() }),
      options({ policy }),
    );
    expect(response.status).to.eql(504);
    expect(await response.text()).to.eql('');
    expect(cancelled).to.eql(2);
  });

  it('isolates per-call abort, removes its listener, and disposes all other pending sends', async () => {
    const signal = new AbortController();
    const balance = trackSignal(signal.signal);
    const client = HttpCmd.client({
      url: URL,
      policy: POLICY,
      fetch: () => new Promise<Response>(() => {}),
    });
    const first = client.send('x', {}, { signal: signal.signal });
    const second = client.send('x', {});
    signal.abort('private');
    await expectFailure(() => first, 'cancelled');
    expect(balance()).to.eql(0);
    client.dispose();
    await expectFailure(() => second, 'disposed');
  });

  it('removes caller listeners after success and keeps settled results immutable to later aborts', async () => {
    const signal = new AbortController();
    const balance = trackSignal(signal.signal);
    const client = HttpCmd.client({
      url: URL,
      ns: NS,
      policy: POLICY,
      fetch: fetchFor(HttpCmd.handler(options())),
    });
    try {
      expect(await client.send('fixture.echo', { text: 'ok' }, { signal: signal.signal })).to.eql({
        text: 'ok',
      });
      expect(balance()).to.eql(0);
      signal.abort('late');
      expect(await client.send('fixture.echo', { text: 'still ok' })).to.eql({ text: 'still ok' });
    } finally {
      client.dispose();
    }
  });

  it('checks elapsed synchronous serialization before fetch invocation', async () => {
    let calls = 0;
    const client = HttpCmd.client({
      url: URL,
      policy: { ...POLICY, timeout: 5 },
      fetch: () => {
        calls++;
        throw new Error('wrong');
      },
    });
    const payload = {
      toJSON() {
        const end = performance.now() + 10;
        while (performance.now() < end) { /* Deliberate synchronous work cannot be preempted. */ }
        return {};
      },
    };
    try {
      await expectFailure(() => client.send('x', payload), 'timeout', 'not-dispatched');
      expect(calls).to.eql(0);
    } finally {
      client.dispose();
    }
  });

  it('keeps the first observed cancellation cause and sanitizes hostile cleanup', async () => {
    const signal = new AbortController();
    const client = HttpCmd.client({
      url: URL,
      policy: POLICY,
      fetch: () => new Promise<Response>(() => {}),
    });
    const pending = client.send('x', {}, { signal: signal.signal });
    signal.abort('secret');
    client.dispose();
    await expectFailure(() => pending, 'cancelled');
    const hostile = {
      aborted: true,
      addEventListener() {},
      removeEventListener() {
        throw new Error('cleanup-secret');
      },
    } as unknown as AbortSignal;
    const other = HttpCmd.client({ url: URL, policy: POLICY });
    try {
      await expectFailure(
        () => other.send('x', {}, { signal: hostile }),
        'cancelled',
        'not-dispatched',
      );
    } finally {
      other.dispose();
    }
  });
});

function trackSignal(signal: AbortSignal): () => number {
  const add = signal.addEventListener.bind(signal);
  const remove = signal.removeEventListener.bind(signal);
  let balance = 0;
  signal.addEventListener = (...args: Parameters<AbortSignal['addEventListener']>) => {
    balance++;
    return add(...args);
  };
  signal.removeEventListener = (...args: Parameters<AbortSignal['removeEventListener']>) => {
    balance--;
    return remove(...args);
  };
  return () => balance;
}
