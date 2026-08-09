import { describe, expect, it, Net, Rx, type t, Testing, Time } from '../../-test.ts';
import { WebSocketServer } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('WebSocketServer/lifecycle', () => {
  it('start accepts hosted lifecycle options without affecting caller-owned close', async () => {
    const server = WebSocketServer.start({
      path: '/socket',
      lifecycle: 'manual',
      silent: true,
      keyboard: false,
      cmd: { handlers: { ping: () => 'pong' } },
    });

    try {
      expect(server.status().state).to.eql('ready');
    } finally {
      await server.close('test.cleanup');
    }

    expect(server.status().state).to.eql('stopped');
  });

  it('client socket close disposes the command host and removes the connection', async () => {
    const hostDisposed = Fixture.deferred<void>();

    const server = WebSocketServer.create({
      path: '/socket',
      cmd: { handlers: { ping: () => 'pong' } },
      onSocket({ host }) {
        host.dispose$.subscribe(() => hostDisposed.resolve());
      },
    });

    const ws = new WebSocket(server.url);
    const closed = Fixture.waitForClose(ws);

    try {
      await Net.waitFor(ws);
      expect(Fixture.detail(server.status(), 'connections')).to.eql('1');

      Fixture.closeSocket(ws);
      await closed;
      await hostDisposed.promise;

      expect(Fixture.detail(server.status(), 'connections')).to.eql('0');
    } finally {
      Fixture.closeSocket(ws);
      await server.close('test.cleanup');
    }
  });

  it('until closes the server and active sockets', async () => {
    const until = new AbortController();
    const hostDisposed = Fixture.deferred<void>();

    const server = WebSocketServer.create({
      path: '/socket',
      until: until.signal,
      cmd: { handlers: { ping: () => 'pong' } },
      onSocket({ host }) {
        host.dispose$.subscribe(() => hostDisposed.resolve());
      },
    });

    const ws = new WebSocket(server.url);
    const closed = Fixture.waitForClose(ws);

    try {
      await Net.waitFor(ws);
      expect(Fixture.detail(server.status(), 'connections')).to.eql('1');

      until.abort('test.until');
      await hostDisposed.promise;
      await closed;
      await server.finished;

      expect(server.disposed).to.eql(true);
      expect(server.signal.aborted).to.eql(true);
      expect(server.status().state).to.eql('stopped');
      expect(Fixture.detail(server.status(), 'connections')).to.eql('0');
    } finally {
      Fixture.closeSocket(ws);
      await server.close('test.cleanup');
    }
  });

  it('synchronous until disposes only after server construction', async () => {
    const disposed = Fixture.deferred<void>();
    const server = WebSocketServer.create({
      path: '/socket',
      until: Rx.of({ reason: 'synchronous:until' }),
      cmd: { handlers: { ping: () => 'pong' } },
    });
    const fired: t.DisposeAsyncEvent[] = [];
    server.dispose$.subscribe((event) => {
      fired.push(event);
      if (event.payload.is.done) disposed.resolve();
    });

    expect(server.disposed).to.eql(false);
    await disposed.promise;

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
    expect(server.status().state).to.eql('stopped');
    expect(fired.map((event) => event.payload.reason)).to.eql([
      'synchronous:until',
      'synchronous:until',
    ]);
  });

  it('pre-aborted until disposes the constructed server', async () => {
    const until = new AbortController();
    until.abort('test.pre-aborted');
    const disposed = Fixture.deferred<void>();

    const server = WebSocketServer.create({
      path: '/socket',
      until: until.signal,
      cmd: { handlers: { ping: () => 'pong' } },
    });
    server.dispose$.subscribe((event) => {
      if (event.payload.is.done) disposed.resolve();
    });

    expect(server.disposed).to.eql(false);
    await disposed.promise;

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
    expect(server.status().state).to.eql('stopped');
  });

  it('underlying server shutdown bridges into the lifecycle', async () => {
    const disposed = Fixture.deferred<void>();
    const server = WebSocketServer.create({
      path: '/socket',
      cmd: { handlers: { ping: () => 'pong' } },
    });

    server.dispose$.subscribe((event) => {
      if (event.payload.stage === 'complete') disposed.resolve();
    });

    await server.server.shutdown();
    await server.finished;
    await disposed.promise;

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
    expect(server.status().state).to.eql('stopped');
  });

  it('onSocket sync throw closes only that socket and host', async () => {
    const hostDisposed = Fixture.deferred<void>();

    const server = WebSocketServer.create({
      path: '/socket',
      cmd: { handlers: { ping: () => 'pong' } },
      onSocket({ host }) {
        host.dispose$.subscribe(() => hostDisposed.resolve());
        throw new Error('test.onSocket.sync');
      },
    });

    const ws = new WebSocket(server.url);
    const closed = Fixture.waitForClose(ws);

    try {
      await Net.waitFor(ws);
      const event = await closed;
      await hostDisposed.promise;

      expect(event?.code).to.eql(1011);
      expect(server.disposed).to.eql(false);
      expect(server.status().state).to.eql('ready');
      expect(Fixture.detail(server.status(), 'connections')).to.eql('0');
    } finally {
      Fixture.closeSocket(ws);
      await server.close('test.cleanup');
    }
  });

  it('onSocket async rejection closes only that socket and host', async () => {
    const hostDisposed = Fixture.deferred<void>();

    const server = WebSocketServer.create({
      path: '/socket',
      cmd: { handlers: { ping: () => 'pong' } },
      onSocket({ host }) {
        host.dispose$.subscribe(() => hostDisposed.resolve());
        return Time.wait(1).then(() => {
          throw new Error('test.onSocket');
        });
      },
    });

    const ws = new WebSocket(server.url);
    const closed = Fixture.waitForClose(ws);

    try {
      await Net.waitFor(ws);
      const event = await closed;
      await hostDisposed.promise;

      expect(event?.code).to.eql(1011);
      expect(server.disposed).to.eql(false);
      expect(server.status().state).to.eql('ready');
      expect(Fixture.detail(server.status(), 'connections')).to.eql('0');
    } finally {
      Fixture.closeSocket(ws);
      await server.close('test.cleanup');
    }
  });

  it('native disposal preserves opaque shutdown rejection identity and status', async () => {
    const server = WebSocketServer.create({
      path: '/socket',
      cmd: { handlers: { ping: () => 'pong' } },
    });
    const shutdown = server.server.shutdown.bind(server.server);
    const normalizationFailure = new Error('WebSocketServer.create:test:normalization-failure');
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

  it('setup failure after listen rolls back the server', async () => {
    const port = Testing.randomPort();
    const failure = new Error('WebSocketServer.create:test:setup-failure');
    const http: t.WebSocketServer.HttpOptions = {
      handle: () => undefined,
      get urls(): readonly t.WebSocketServer.HttpStatusUrl[] | undefined {
        throw failure;
      },
    };

    let caught: unknown;
    try {
      WebSocketServer.create({
        port,
        path: '/socket',
        cmd: { handlers: { ping: () => 'pong' } },
        http,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).to.equal(failure);

    await Testing.retry(10, { silent: true, delay: 10 }, async () => {
      const replacement = WebSocketServer.create({
        port,
        path: '/socket',
        cmd: { handlers: { ping: () => 'pong' } },
      });
      await replacement.close('test:port-reacquired');
    });
  });

  it('native await using shuts down the server', async () => {
    const server = WebSocketServer.create({
      path: '/socket',
      cmd: { handlers: { ping: () => 'pong' } },
    });

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

  it('dispose() shuts down the server, active sockets, and command hosts', async () => {
    let accepted = false;
    const hostDisposed = Fixture.deferred<void>();

    const server = WebSocketServer.create({
      path: '/socket',
      cmd: { handlers: { ping: () => 'pong' } },
      onSocket({ host }) {
        accepted = true;
        host.dispose$.subscribe(() => hostDisposed.resolve());
      },
    });

    const ws = new WebSocket(server.url);
    const closed = Fixture.waitForClose(ws);

    try {
      await Net.waitFor(ws);
      expect(accepted).to.eql(true);
      expect(Fixture.detail(server.status(), 'connections')).to.eql('1');

      const completion = server.dispose('test.dispose');
      expect(server.close('test.close:later')).to.equal(completion);
      expect(server[Symbol.asyncDispose]()).to.equal(completion);
      await completion;
      await hostDisposed.promise;
      await closed;

      expect(server.disposed).to.eql(true);
      expect(server.signal.aborted).to.eql(true);
      expect(server.status().state).to.eql('stopped');
      expect(Fixture.detail(server.status(), 'connections')).to.eql('0');
    } finally {
      Fixture.closeSocket(ws);
      await server.close('test.cleanup');
    }
  });
});
