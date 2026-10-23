import { describe, expect, it, type t, Time } from '../../../-test.ts';
import { HttpServer } from '../mod.ts';
import { startWith } from '../u/u.start.ts';

describe('HttpServer.start settlement', () => {
  it('pending shutdown → independent keyboard cleanup and one shared completion', async () => {
    await using runtime = fixture();
    const server = runtime.start();
    const completion = server.close('first');
    const outcomes = Promise.allSettled([completion]);

    expect(server.dispose('later')).to.equal(completion);
    expect(server[Symbol.asyncDispose]()).to.equal(completion);
    expect(runtime.calls).to.eql({ shutdown: 1, keyboard: 1 });
    expect(server.signal.aborted).to.eql(true);
    runtime.keyboard.resolve();
    runtime.finished.resolve();
    await Time.wait(0);
    expect(server.status().state).to.eql('stopping');
    expect(server.disposed).to.eql(false);

    runtime.shutdown.resolve();
    expect(await outcomes).to.eql([{ status: 'fulfilled', value: undefined }]);
    expect(server.status().state).to.eql('stopped');
    expect(server.disposed).to.eql(true);
    expect(server.close()).to.equal(completion);
    expect(runtime.calls).to.eql({ shutdown: 1, keyboard: 1 });
  });

  it('shutdown rejection → waits for completion and preserves opaque or falsy reasons', async () => {
    const opaque = {
      get message(): string {
        throw new Error('unreadable');
      },
    };
    for (const reason of [opaque, undefined, null, false, 0, -0, NaN, '']) {
      await using runtime = fixture();
      const server = runtime.start();
      const outcomes = Promise.allSettled([server.close()]);
      runtime.shutdown.reject(reason);
      runtime.keyboard.resolve();
      await Time.wait(0);
      expect(runtime.calls.keyboard).to.eql(1);
      expect(server.status().state).to.eql('stopping');
      expect(server.disposed).to.eql(false);

      runtime.finished.resolve();
      const [result] = await outcomes;
      if (result.status !== 'rejected') throw new Error('Expected shutdown rejection.');
      expect(Object.is(result.reason, reason)).to.eql(true);
      expect(server.status().state).to.eql('error');
      expect(server.disposed).to.eql(true);
    }
  });

  it('synchronous shutdown throw → keyboard cleanup starts and completion is still joined', async () => {
    await using runtime = fixture();
    const server = runtime.start();
    const failure = new Error('synchronous shutdown failure');
    runtime.native.shutdown = () => {
      throw failure;
    };
    const outcomes = Promise.allSettled([server.close()]);
    expect(runtime.calls.keyboard).to.eql(1);
    runtime.keyboard.resolve();
    await Time.wait(0);
    expect(server.status().state).to.eql('stopping');
    runtime.finished.resolve();
    const [result] = await outcomes;
    if (result.status !== 'rejected') throw new Error('Expected synchronous shutdown rejection.');
    expect(result.reason).to.equal(failure);
  });

  it('early completion rejection → autonomous cleanup retains the original failure', async () => {
    await using runtime = fixture();
    const server = runtime.start();
    const failure = new Error('completion failed');
    runtime.finished.reject(failure);
    await Time.wait(0);
    expect(runtime.calls).to.eql({ shutdown: 1, keyboard: 1 });
    expect(server.status().state).to.eql('stopping');

    const outcomes = Promise.allSettled([server.close()]);
    runtime.shutdown.resolve();
    runtime.keyboard.resolve();
    const [result] = await outcomes;
    if (result.status !== 'rejected') throw new Error('Expected completion rejection.');
    expect(result.reason).to.equal(failure);
    expect(server.status().state).to.eql('error');
    expect(runtime.calls).to.eql({ shutdown: 1, keyboard: 1 });
  });

  it('independent failures → shutdown, completion, keyboard order without flattening', async () => {
    const orders = [
      ['keyboard', 'finished', 'shutdown'],
      ['shutdown', 'finished', 'keyboard'],
    ] as const;
    for (const order of orders) {
      await using runtime = fixture();
      const server = runtime.start();
      const failures = {
        shutdown: new Error('shutdown failed'),
        finished: new AggregateError([new Error('nested')], 'completion failed'),
        keyboard: new Error('keyboard failed'),
      };
      const outcomes = Promise.allSettled([server.close()]);
      for (const part of order) runtime[part].reject(failures[part]);
      const [result] = await outcomes;
      if (result.status !== 'rejected') throw new Error('Expected joined failure.');
      const error = result.reason;
      expect(error).to.be.instanceOf(AggregateError);
      expect(error.errors).to.have.length(3);
      const expected = [failures.shutdown, failures.finished, failures.keyboard];
      for (const [index, failure] of expected.entries()) {
        expect(error.errors[index]).to.equal(failure);
      }
      expect(error.cause).to.equal(failures.shutdown);
      expect(server.status().state).to.eql('error');
      expect(runtime.calls).to.eql({ shutdown: 1, keyboard: 1 });
    }
  });

  it('repeated rejection value → one failure identity, not duplicate observations', async () => {
    for (const reason of [new Error('shared rejection'), undefined]) {
      await using runtime = fixture();
      const server = runtime.start();
      const outcomes = Promise.allSettled([server.close()]);
      runtime.shutdown.reject(reason);
      runtime.finished.reject(reason);
      runtime.keyboard.reject(reason);
      const [result] = await outcomes;
      if (result.status !== 'rejected') throw new Error('Expected shared rejection.');
      expect(result.reason).to.equal(reason);
    }
  });

  it('finished property replacement → disposal still joins the captured completion', async () => {
    await using runtime = fixture();
    const server = runtime.start();
    const failure = new Error('captured completion failed');
    expect(server.finished).to.equal(runtime.finished.promise);
    Object.defineProperty(runtime.native, 'finished', { value: Promise.resolve() });
    const outcomes = Promise.allSettled([server.close()]);
    runtime.shutdown.resolve();
    runtime.keyboard.resolve();
    await Time.wait(0);
    expect(server.status().state).to.eql('stopping');

    runtime.finished.reject(failure);
    const [result] = await outcomes;
    if (result.status !== 'rejected') throw new Error('Expected captured completion rejection.');
    expect(result.reason).to.equal(failure);
  });

  it('reentrant shutdown → reuses disposal without waiting on its own observers', async () => {
    await using runtime = fixture();
    const server = runtime.start();
    const shutdown = runtime.native.shutdown;
    let reentered: PromiseLike<void> | undefined;
    runtime.native.shutdown = () => {
      reentered = server[Symbol.asyncDispose]();
      return shutdown();
    };
    const completion = server.close();
    expect(reentered).to.equal(completion);
    runtime.finished.resolve();
    runtime.shutdown.resolve();
    runtime.keyboard.resolve();
    await completion;
    expect(runtime.calls).to.eql({ shutdown: 1, keyboard: 1 });
    expect(server.status().state).to.eql('stopped');
  });

  it('startup failure → synchronous identity survives observed asynchronous cleanup failures', async () => {
    await using runtime = fixture();
    const startupFailure = new Error('startup failed');
    let caught: unknown;
    try {
      runtime.start({
        silent: false,
        status: { details: [{ label: 'fixture', value: 'startup' }] },
        formatDetail() {
          throw startupFailure;
        },
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).to.equal(startupFailure);
    expect(runtime.calls).to.eql({ shutdown: 1, keyboard: 1 });
    runtime.finished.reject(new Error('late completion failure'));
    runtime.shutdown.reject(new Error('late shutdown failure'));
    runtime.keyboard.reject(new Error('late keyboard failure'));
    await Time.wait(0);
  });
});

/** Controlled owner outcomes; native listener behavior is covered by the start suite. */
function fixture() {
  const shutdown = Promise.withResolvers<void>();
  const finished = Promise.withResolvers<void>();
  const keyboard = Promise.withResolvers<void>();
  let shutdownCalls = 0;
  let keyboardCalls = 0;
  let owner: t.HttpServer.Started | undefined;
  const native: Deno.HttpServer<Deno.NetAddr> = {
    addr: { transport: 'tcp', hostname: '127.0.0.1', port: 8080 },
    finished: finished.promise,
    shutdown() {
      shutdownCalls++;
      return shutdown.promise;
    },
    ref() {},
    unref() {},
    [Symbol.asyncDispose]() {
      return this.shutdown();
    },
  };

  return {
    native,
    shutdown,
    finished,
    keyboard,
    get calls() {
      return { shutdown: shutdownCalls, keyboard: keyboardCalls };
    },
    start(options: t.HttpServer.Start.Options = {}) {
      const deps = {
        serve: () => native,
        bindKeyboard: () => ({
          finished: keyboard.promise,
          dispose() {
            keyboardCalls++;
          },
        }),
      };
      owner = startWith(deps, HttpServer.create({ static: false }), {
        port: 0,
        strictPort: true,
        silent: true,
        keyboard: true,
        ...options,
      });
      return owner;
    },
    async [Symbol.asyncDispose]() {
      // Release controlled work before awaiting cleanup, including after a failed assertion.
      shutdown.resolve();
      finished.resolve();
      keyboard.resolve();
      await Promise.allSettled([owner?.close()]);
    },
  };
}
