import { describe, expect, it, Rx } from '../../../-test.ts';
import { Dispose, Is, type t } from '../common.ts';
import { HttpServer } from '../mod.ts';
import { type StartDependencies, startWith } from '../u/u.start.ts';
import { waitForDispose } from './u.fixture.lifecycle.ts';
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

  it('binds an explicit strict port directly while preserving default fallback selection', async () => {
    const blocker = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    const port = blocker.addr.port;
    const app = HttpServer.create({ static: false });
    const abort = new AbortController();
    let keyboardBinds = 0;
    let fallback: t.HttpServer.Started | undefined;
    let strict: t.HttpServer.Started | undefined;
    const deps: StartDependencies = {
      bindKeyboard() {
        keyboardBinds += 1;
        return undefined;
      },
    };
    const options: t.HttpServer.Start.Options = {
      hostname: '127.0.0.1',
      port,
      strictPort: true,
      silent: true,
      keyboard: true,
      until: abort.signal,
    };

    try {
      fallback = HttpServer.start(app, { hostname: '127.0.0.1', port, silent: true });
      expect(fallback.port).to.not.eql(port);
      await fallback.close('test:fallback');
      fallback = undefined;

      let failure: unknown;
      try {
        strict = startWith(deps, app, options);
      } catch (cause) {
        failure = cause;
      }
      expect(failure).to.be.instanceOf(Deno.errors.AddrInUse);
      expect(keyboardBinds).to.eql(0);
    } finally {
      abort.abort('test:cleanup');
      await strict?.close('test:unexpected-strict-listener');
      await fallback?.close('test:cleanup');
      blocker.close();
    }
  });

  it('preserves native invalid-port validation for explicit strict ports', async () => {
    const app = HttpServer.create({ static: false });
    const port: t.PortNumber = -1;
    let nativeServer: Deno.HttpServer<Deno.NetAddr> | undefined;
    let wrappedServer: t.HttpServer.Started | undefined;
    let nativeFailure: unknown;
    let wrappedFailure: unknown;

    try {
      try {
        nativeServer = Deno.serve(
          { hostname: '127.0.0.1', port, onListen: () => undefined },
          () => new Response(),
        );
      } catch (cause) {
        nativeFailure = cause;
      }
      try {
        wrappedServer = HttpServer.start(app, {
          hostname: '127.0.0.1',
          port,
          strictPort: true,
          silent: true,
        });
      } catch (cause) {
        wrappedFailure = cause;
      }

      if (!Is.error(nativeFailure) || !Is.error(wrappedFailure)) {
        throw new Error('Both native and wrapped servers must reject the invalid port.');
      }
      expect(wrappedFailure.constructor).to.equal(nativeFailure.constructor);
      expect(wrappedFailure.name).to.eql(nativeFailure.name);
      expect(wrappedFailure.message).to.eql(nativeFailure.message);
    } finally {
      if (nativeServer) {
        await nativeServer.shutdown();
        await nativeServer.finished;
      }
      await wrappedServer?.close('test:unexpected-invalid-port-listener');
    }
  });

  it('exposes renderer-neutral service status snapshots', async () => {
    const app = HttpServer.create({ static: false });
    await using server = HttpServer.start(app, {
      silent: true,
      hostname: '127.0.0.1',
      name: 'test:http',
      dir: '/tmp/http-root',
      status: {
        kind: 'fixture',
        config: '/tmp/http.yaml',
        urlPaths: ['/api/', { label: 'health', path: '/-/health' }],
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
    await using server = HttpServer.start(app, { silent: true });
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

  it('closes through captured disposal construction after ambient Promise mutation', async () => {
    const app = HttpServer.create({ static: false });
    await using server = HttpServer.start(app, { silent: true });
    const descriptor = Object.getOwnPropertyDescriptor(Promise, 'withResolvers');
    if (!descriptor) throw new Error('Expected Promise.withResolvers descriptor.');
    let calls = 0;
    let completion: Promise<void>;

    try {
      Object.defineProperty(Promise, 'withResolvers', {
        ...descriptor,
        value() {
          calls += 1;
          throw new Error('ambient Promise.withResolvers invoked');
        },
      });
      completion = server.close('captured-disposal-authority');
    } finally {
      Object.defineProperty(Promise, 'withResolvers', descriptor);
    }

    await completion;
    await server.finished;
    expect(calls).to.eql(0);
    expect(server.disposed).to.eql(true);
  });

  it('native disposal preserves opaque shutdown rejection identity and status', async () => {
    const app = HttpServer.create({ static: false });
    const server = HttpServer.start(app, { silent: true });
    const shutdown = server.server.shutdown.bind(server.server);
    let nativeShutdown: Promise<void> | undefined;
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

      const outcomes = Promise.allSettled([completion]);
      // The injected rejection does not stop the native listener; release it independently.
      nativeShutdown = shutdown();
      const [result] = await outcomes;
      if (result.status !== 'rejected') throw new Error('Expected shutdown rejection.');
      expect(result.reason).to.equal(failure);
      expect(server.disposed).to.eql(true);
      expect(server.status().state).to.eql('error');
      expect(fired.map((event) => event.payload.reason)).to.eql([undefined, undefined]);
    } finally {
      await (nativeShutdown ?? shutdown());
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

  it('until AbortSignal disposes the server lifecycle', async () => {
    const app = HttpServer.create({ static: false });
    const abort = new AbortController();
    await using server = HttpServer.start(app, { silent: true, until: abort.signal });
    const disposed = waitForDispose(server);

    abort.abort('external');
    await disposed;

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
  });

  it('synchronous until disposes only after server construction', async () => {
    const app = HttpServer.create({ static: false });
    await using server = HttpServer.start(app, {
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

    await using server = HttpServer.start(app, { silent: true, until: abort.signal });
    await waitForDispose(server);

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
  });

  it('until lifecycle disposes the server lifecycle', async () => {
    const app = HttpServer.create({ static: false });
    const life = Dispose.lifecycle();
    await using server = HttpServer.start(app, { silent: true, until: life });
    const disposed = waitForDispose(server);

    life.dispose('until');
    await disposed;

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
  });
});
