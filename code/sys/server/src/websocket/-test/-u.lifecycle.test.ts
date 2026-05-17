import { describe, expect, it, Net, Time } from '../../-test.ts';
import { WebSocketServer } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('WebSocketServer/lifecycle', () => {
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

      await server.dispose('test.dispose');
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
