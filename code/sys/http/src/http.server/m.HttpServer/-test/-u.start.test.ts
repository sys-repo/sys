import { Cli, describe, expect, it, Rx, Testing } from '../../../-test.ts';
import { Dispose, type t } from '../common.ts';
import { HttpServer } from '../mod.ts';
import { bindKeyboardWith } from '../u/u.keyboard.ts';
import { startWith } from '../u/u.start.ts';
import { testFetcher } from './u.fixture.usingServer.ts';

describe('HttpServer.start', () => {
  it('app: start → req/res → close', async () => {
    const app = HttpServer.create({ static: false });
    app.get('/', (c) => c.json({ count: 123 }));

    const server = HttpServer.start(app, { silent: true, hostname: '127.0.0.1' });
    const fetch = testFetcher(server.origin);

    try {
      type T = { count: number };
      const res = await fetch.json<T>(`${server.origin}/`);

      expect(res.status).to.eql(200);
      expect(res.data).to.eql({ count: 123 });
      expect(server.hostname).to.eql('127.0.0.1');
      expect(server.origin).to.eql(`http://localhost:${server.port}`);
      expect(server.addr.port).to.eql(server.port);
      expect(server.signal.aborted).to.eql(false);
    } finally {
      fetch.dispose();
      await server.close('test');
    }

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
  });

  it('exposes renderer-neutral service status snapshots', async () => {
    const app = HttpServer.create({ static: false });
    const server = HttpServer.start(app, {
      silent: true,
      hostname: '127.0.0.1',
      name: 'test:http',
      dir: '/tmp/http-root' as t.StringDir,
      status: {
        kind: 'fixture',
        config: '/tmp/http.yaml' as t.StringPath,
        urlPaths: [
          '/api/' as t.StringUrlRoute,
          { label: 'health', path: '/-/health' as t.StringUrlRoute },
        ],
        details: [{ label: 'mode', value: 'test' }],
      },
    });

    expect(server.status()).to.eql({
      state: 'ready',
      kind: 'fixture',
      name: 'test:http',
      root: '/tmp/http-root',
      config: '/tmp/http.yaml',
      urls: [
        { href: `${server.origin}/api/` },
        { href: `${server.origin}/-/health`, label: 'health' },
      ],
      details: [{ label: 'mode', value: 'test' }],
    });

    await server.close('test.status');
    await server.finished;

    expect(server.status().state).to.eql('stopped');
  });

  it('close/direct/native entrypoints share one completion', async () => {
    const app = HttpServer.create({ static: false });
    const server = HttpServer.start(app, { silent: true });
    const fired: t.DisposeAsyncEvent[] = [];
    server.dispose$.subscribe((event) => fired.push(event));

    const completion = server.close('close:first');
    expect(server.dispose('direct:later')).to.equal(completion);
    expect(server[Symbol.asyncDispose]()).to.equal(completion);

    await completion;
    expect(server.disposed).to.eql(true);
    expect(fired.map((event) => event.payload.stage)).to.eql(['start', 'complete']);
    expect(fired.map((event) => event.payload.reason)).to.eql(['close:first', 'close:first']);
  });

  it('native disposal preserves opaque shutdown rejection identity and status', async () => {
    const app = HttpServer.create({ static: false });
    const server = HttpServer.start(app, { silent: true });
    const shutdown = server.server.shutdown.bind(server.server);
    const normalizationFailure = new Error('HttpServer.start:test:normalization-failure');
    const failure = {
      get message(): string {
        throw normalizationFailure;
      },
    };
    const fired: t.DisposeAsyncEvent[] = [];
    server.dispose$.subscribe((event) => fired.push(event));

    try {
      Object.defineProperty(server.server, 'shutdown', {
        configurable: true,
        value: () => Promise.reject(failure),
      });

      const completion = server[Symbol.asyncDispose]();
      expect(server.dispose('direct:later')).to.equal(completion);
      expect(server.close('close:later')).to.equal(completion);

      let caught: unknown;
      try {
        await completion;
      } catch (error) {
        caught = error;
      }

      expect(caught).to.equal(failure);
      expect(server.disposed).to.eql(true);
      expect(server.status().state).to.eql('error');
      expect(fired.map((event) => event.payload.reason)).to.eql([undefined, undefined]);
    } finally {
      await shutdown();
      await server.finished;
    }
  });

  it('native await using shuts down the server', async () => {
    const app = HttpServer.create({ static: false });
    const server = HttpServer.start(app, { silent: true });

    {
      await using resource = server;
      expect(resource).to.equal(server);
      expect(server.disposed).to.eql(false);
      expect(server.signal.aborted).to.eql(false);
    }

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
    expect(server.status().state).to.eql('stopped');
  });

  it('setup failure after listen rolls back the server', async () => {
    const app = HttpServer.create({ static: false });
    const port = Testing.randomPort();
    const failure = new Error('HttpServer.start:test:setup-failure');
    const options: t.HttpServer.Start.Options = {
      port,
      hostname: '127.0.0.1',
      get silent(): boolean {
        throw failure;
      },
    };

    let caught: unknown;
    try {
      HttpServer.start(app, options);
    } catch (error) {
      caught = error;
    }
    expect(caught).to.equal(failure);

    await Testing.retry(10, { silent: true, delay: 10 }, async () => {
      const replacement = HttpServer.start(app, {
        port,
        hostname: '127.0.0.1',
        silent: true,
      });
      await replacement.close('test:port-reacquired');
    });
  });

  it('wildcard bind address still reports a local origin', async () => {
    const app = HttpServer.create({ static: false });
    const server = HttpServer.start(app, { silent: true, hostname: '0.0.0.0' });

    try {
      expect(server.hostname).to.eql('0.0.0.0');
      expect(server.origin).to.eql(`http://localhost:${server.port}`);
    } finally {
      await server.close('test');
    }
  });

  it('settles one exact ephemeral IPv4 authority across origin, status, and output', async () => {
    const app = HttpServer.create({ static: false });
    const lines = capturePrint(() =>
      HttpServer.start(app, {
        port: 0,
        hostname: '127.0.0.1',
        origin: 'exact-loopback',
        status: { urlPaths: ['/health'] },
      })
    );
    const server = lines.value;

    try {
      expect(server.port).to.not.eql(0);
      expect(server.origin).to.eql(`http://127.0.0.1:${server.port}`);
      expect(server.status().urls).to.eql([{ href: `${server.origin}/health` }]);
      const output = Cli.stripAnsi(lines.output.join('\n'));
      expect(output).to.contain(`${server.origin}/health`);
      expect(output).to.not.contain(`http://localhost:${server.port}`);
    } finally {
      await server.close('test');
    }
  });

  it('formats one exact IPv6 listener authority across origin and output', async () => {
    const app = HttpServer.create({ static: false });
    const lines = capturePrint(() =>
      HttpServer.start(app, {
        hostname: '::1',
        origin: 'exact-loopback',
      })
    );
    const server = lines.value;

    try {
      expect(server.origin).to.eql(`http://[::1]:${server.port}`);
      expect(Cli.stripAnsi(lines.output.join('\n'))).to.contain(`${server.origin}/`);
    } finally {
      await server.close('test');
    }
  });

  it('rejects unknown origin modes before opening a listener', () => {
    const app = HttpServer.create({ static: false });
    expect(() =>
      HttpServer.start(app, {
        silent: true,
        hostname: '127.0.0.1',
        origin: 'caller-origin' as t.HttpServer.Start.OriginMode,
      })
    ).to.throw('HttpServer.start origin must be exact-loopback when specified');
  });

  it('rejects exact loopback origins for wildcard, hostname, and non-loopback binds', () => {
    const app = HttpServer.create({ static: false });
    for (
      const hostname of [
        '0.0.0.0',
        '::',
        'localhost',
        '127.0.0.2',
        '[::1]',
        '192.0.2.10',
        '2001:db8::1',
      ]
    ) {
      expect(() =>
        HttpServer.start(app, {
          silent: true,
          hostname: hostname as t.StringHostname,
          origin: 'exact-loopback',
        })
      ).to.throw('HttpServer.start exact-loopback origin requires a numeric loopback hostname');
    }
  });

  it('snapshots exact origin authority against post-call option mutation', async () => {
    const app = HttpServer.create({ static: false });
    const input: t.HttpServer.Start.Options = {
      silent: true,
      hostname: '127.0.0.1',
      origin: 'exact-loopback',
      status: { urlPaths: ['/health'] },
    };
    const server = HttpServer.start(app, input);
    input.hostname = '0.0.0.0';
    input.origin = undefined;
    input.status = { urlPaths: ['/changed'] };

    try {
      expect(server.hostname).to.eql('127.0.0.1');
      expect(server.origin).to.eql(`http://127.0.0.1:${server.port}`);
      expect(server.status().urls).to.eql([{ href: `${server.origin}/health` }]);
    } finally {
      await server.close('test');
    }
  });

  it('opens the first status URL from the exact settled authority', async () => {
    const app = HttpServer.create({ static: false });
    type KeyboardOptions = Parameters<typeof Cli.Keyboard.bind>[0];
    type KeyHandler = NonNullable<KeyboardOptions['onKey']>;
    let keyboard: KeyboardOptions | undefined;
    let command: string | undefined;
    const keyboardFinished = Promise.withResolvers<void>();
    const keyboardDeps: Parameters<typeof bindKeyboardWith>[0] = {
      bind(options) {
        keyboard = options;
        return {
          dispose: () => keyboardFinished.resolve(),
          finished: keyboardFinished.promise,
        };
      },
      isUnavailableError: Cli.Keyboard.isUnavailableError,
      sh: () => ({
        path: '',
        run(script) {
          command = script;
          return Promise.resolve(undefined as never);
        },
      }),
      exit: () => {
        throw new Error('Unexpected process exit.');
      },
    };

    let server: t.HttpServer.Started | undefined;
    try {
      server = startWith(
        { bindKeyboard: (args) => bindKeyboardWith(keyboardDeps, args) },
        app,
        {
          silent: true,
          hostname: '127.0.0.1',
          origin: 'exact-loopback',
          status: { urlPaths: ['/health'] },
          keyboard: true,
        },
      );
      const event = { key: 'o', ctrlKey: false } as Parameters<KeyHandler>[0];
      await keyboard?.onKey?.(event);

      expect(command).to.eql(`open ${server.origin}/health`);
    } finally {
      await server?.close('test');
    }
  });

  it('defers explicit process exit until owned keyboard shutdown completes', async () => {
    const app = HttpServer.create({ static: false });
    type KeyboardOptions = Parameters<typeof Cli.Keyboard.bind>[0];
    let keyboard: KeyboardOptions | undefined;
    const keyboardFinished = Promise.withResolvers<void>();
    const exitRequested = Promise.withResolvers<void>();
    const exitFailure = new Error('test process exit');
    let exitCalls = 0;
    const keyboardDeps: Parameters<typeof bindKeyboardWith>[0] = {
      bind(options) {
        keyboard = options;
        return {
          dispose: () => keyboardFinished.resolve(),
          finished: keyboardFinished.promise,
        };
      },
      isUnavailableError: Cli.Keyboard.isUnavailableError,
      sh: () => ({
        path: '',
        run: () => Promise.resolve(undefined as never),
      }),
      exit() {
        exitCalls += 1;
        exitRequested.resolve();
        throw exitFailure;
      },
    };
    const server = startWith(
      { bindKeyboard: (args) => bindKeyboardWith(keyboardDeps, args) },
      app,
      { silent: true, keyboard: { exit: true } },
    );

    expect(keyboard?.exit).to.eql(false);
    expect(keyboard?.onQuit()).to.eql(undefined);
    expect(exitCalls).to.eql(0);
    expect(server.status().state).to.eql('stopping');

    await exitRequested.promise;
    expect(exitCalls).to.eql(1);
    expect(server.status().state).to.eql('stopped');
    await server.close('test.keyboard.already-stopped');
  });

  it('retries keyboard disposal and waits for listener termination before stopped', async () => {
    const keyboardFinished = Promise.withResolvers<void>();
    const disposalAccepted = Promise.withResolvers<void>();
    let disposeCalls = 0;
    const server = startWithKeyboard({
      finished: keyboardFinished.promise,
      dispose() {
        disposeCalls += 1;
        if (disposeCalls === 1) throw new Error('first keyboard disposal failed');
        disposalAccepted.resolve();
      },
    });

    const closing = server.close('test.keyboard.retry');
    await server.finished;
    await disposalAccepted.promise;
    expect(disposeCalls).to.eql(2);
    expect(server.status().state).to.eql('stopping');

    keyboardFinished.resolve();
    await closing;
    expect(server.status().state).to.eql('stopped');
  });

  it('keeps shutdown stopping while failed keyboard disposal remains unresolved', async () => {
    const keyboardFinished = Promise.withResolvers<void>();
    const disposalRequested = Promise.withResolvers<void>();
    const keyboardFailure = new Error('keyboard listener failed');
    let disposeCalls = 0;
    const server = startWithKeyboard({
      finished: keyboardFinished.promise,
      dispose() {
        disposeCalls += 1;
        disposalRequested.resolve();
        throw new Error('keyboard disposal failed');
      },
    });

    const closing = server.close('test.keyboard.pending').then(
      () => undefined,
      (cause) => cause,
    );
    await server.finished;
    await disposalRequested.promise;
    expect(disposeCalls).to.eql(2);
    expect(server.status().state).to.eql('stopping');

    keyboardFinished.reject(keyboardFailure);
    expect(await closing).to.equal(keyboardFailure);
    expect(server.status().state).to.eql('error');
  });

  it('enters shutdown autonomously when the keyboard listener fails', async () => {
    const keyboardFinished = Promise.withResolvers<void>();
    const disposalRequested = Promise.withResolvers<void>();
    const keyboardFailure = new Error('keyboard listener failed');
    let disposeCalls = 0;
    const server = startWithKeyboard({
      finished: keyboardFinished.promise,
      dispose() {
        disposeCalls += 1;
        disposalRequested.resolve();
      },
    });
    const disposed = waitForDispose(server);

    keyboardFinished.reject(keyboardFailure);
    await disposalRequested.promise;
    await disposed;

    expect(disposeCalls).to.eql(1);
    expect(server.signal.aborted).to.eql(true);
    expect(server.status().state).to.eql('error');
    const failure = await server.close('test.keyboard.already-failed').then(
      () => undefined,
      (cause) => cause,
    );
    expect(failure).to.equal(keyboardFailure);
  });

  it('until AbortSignal disposes the server lifecycle', async () => {
    const app = HttpServer.create({ static: false });
    const abort = new AbortController();
    const server = HttpServer.start(app, { silent: true, until: abort.signal });
    const disposed = waitForDispose(server);

    abort.abort('external');
    await disposed;

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
  });

  it('synchronous until disposes only after server construction', async () => {
    const app = HttpServer.create({ static: false });
    const server = HttpServer.start(app, {
      silent: true,
      until: Rx.of({ reason: 'synchronous:until' }),
    });
    const fired: t.DisposeAsyncEvent[] = [];
    server.dispose$.subscribe((event) => fired.push(event));

    expect(server.disposed).to.eql(false);
    await waitForDispose(server);

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
    expect(server.status().state).to.eql('stopped');
    expect(fired.map((event) => event.payload.reason)).to.eql([
      'synchronous:until',
      'synchronous:until',
    ]);
  });

  it('pre-aborted until AbortSignal disposes the server lifecycle', async () => {
    const app = HttpServer.create({ static: false });
    const abort = new AbortController();
    abort.abort('external');

    const server = HttpServer.start(app, { silent: true, until: abort.signal });
    await waitForDispose(server);

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
  });

  it('until lifecycle disposes the server lifecycle', async () => {
    const app = HttpServer.create({ static: false });
    const life = Dispose.lifecycle();
    const server = HttpServer.start(app, { silent: true, until: life });
    const disposed = waitForDispose(server);

    life.dispose('until');
    await disposed;

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
  });
});

function startWithKeyboard(handle: NonNullable<ReturnType<typeof Cli.Keyboard.bind>>) {
  const app = HttpServer.create({ static: false });
  return startWith({ bindKeyboard: () => handle }, app, { silent: true, keyboard: true });
}

function capturePrint<T>(fn: () => T): { readonly value: T; readonly output: readonly string[] } {
  const output: string[] = [];
  const original = console.info;
  console.info = (...args: unknown[]) => output.push(args.map(String).join(' '));
  try {
    return { value: fn(), output };
  } finally {
    console.info = original;
  }
}

function waitForDispose(life: t.LifecycleAsync) {
  if (life.disposed) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const sub = life.dispose$.subscribe((e) => {
      const stage = e.payload.stage;
      if (stage === 'complete' || stage === 'error') {
        sub.unsubscribe();
        resolve();
      }
    });
  });
}
