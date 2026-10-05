import { Cmd, describe, expect, it, Net, Time } from '../../-test.ts';
import { WebSocketServer } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('WebSocketServer/Cmd transport', () => {
  it('runs a typed Cmd roundtrip over WebSocket', async () => {
    type Name = 'math:add';
    type Payload = { 'math:add': { left: number; right: number } };
    type Result = { 'math:add': { total: number } };

    const ns = 'test.roundtrip';
    const cmd = Cmd.make<Name, Payload, Result>({ ns });
    const server = WebSocketServer.create<Name, Payload, Result>({
      path: '/rpc',
      cmd: {
        ns,
        handlers: {
          'math:add': ({ left, right }) => ({ total: left + right }),
        },
      },
    });

    const ws = new WebSocket(server.url);
    const closed = Fixture.waitForClose(ws);

    try {
      await Net.waitFor(ws);
      const client = cmd.client(Cmd.Transport.fromWebSocket(ws), { timeout: 1_000 });
      try {
        const result = await client.send('math:add', { left: 20, right: 22 });
        expect(result).to.eql({ total: 42 });
        expect(Fixture.detail(server.status(), 'connections')).to.eql('1');
      } finally {
        client.dispose();
      }
    } finally {
      Fixture.closeSocket(ws);
      await closed;
      await server.close('test.cleanup');
    }
  });

  it('propagates handler failures as Cmd remote errors', async () => {
    type Name = 'fail';
    type Payload = { fail: { message: string } };
    type Result = { fail: { ok: true } };

    const ns = 'test.remote-error';
    const cmd = Cmd.make<Name, Payload, Result>({ ns });
    const server = WebSocketServer.create<Name, Payload, Result>({
      path: '/rpc',
      cmd: {
        ns,
        handlers: {
          fail({ message }) {
            throw new Error(message);
          },
        },
      },
    });

    const ws = new WebSocket(server.url);
    const closed = Fixture.waitForClose(ws);

    try {
      await Net.waitFor(ws);
      const client = cmd.client(Cmd.Transport.fromWebSocket(ws), { timeout: 1_000 });
      try {
        const error = await client.send('fail', { message: 'boom' }).catch((e: unknown) => e);
        Fixture.expectCmdError(error, 'CmdError.Remote', 'fail');
        expect((error as Error).message).to.eql('boom');
      } finally {
        client.dispose();
      }
    } finally {
      Fixture.closeSocket(ws);
      await closed;
      await server.close('test.cleanup');
    }
  });

  it('cancels active streamed commands when the client disposes the stream', async () => {
    type Name = 'count';
    type Payload = { count: { from: number } };
    type Result = { count: { done: true } };
    type Event = { count: { value: number } };

    const ns = 'test.stream-cancel';
    const cmd = Cmd.make<Name, Payload, Result, Event>({ ns });
    const started = Fixture.deferred<void>();
    const aborted = Fixture.deferred<unknown>();

    const server = WebSocketServer.create<Name, Payload, Result, Event>({
      path: '/rpc',
      cmd: {
        ns,
        handlers: {
          async count(e, ctx) {
            ctx.emit({ value: e.from });
            ctx.signal.addEventListener('abort', () => aborted.resolve(ctx.signal.reason), {
              once: true,
            });
            started.resolve();
            await aborted.promise;
            return { done: true };
          },
        },
      },
    });

    const ws = new WebSocket(server.url);
    const closed = Fixture.waitForClose(ws);

    try {
      await Net.waitFor(ws);
      const client = cmd.client(Cmd.Transport.fromWebSocket(ws), { timeout: 1_000 });
      try {
        const stream = client.stream('count', { from: 7 });
        try {
          await started.promise;
          stream.dispose();

          const error = await stream.done.catch((e: unknown) => e);
          Fixture.expectCmdError(error, 'CmdError.Cancelled', 'count');
          expect(await aborted.promise).to.eql('stream-dispose');
        } finally {
          stream.dispose();
        }
      } finally {
        client.dispose();
      }
    } finally {
      Fixture.closeSocket(ws);
      await closed;
      await server.close('test.cleanup');
    }
  });

  it('keeps command namespaces isolated over the WebSocket transport', async () => {
    type Name = 'ping';
    type Payload = { ping: {} };
    type Result = { ping: { ok: true } };

    const serverCmd = Cmd.make<Name, Payload, Result>({ ns: 'test.ns.server' });
    const wrongCmd = Cmd.make<Name, Payload, Result>({ ns: 'test.ns.wrong' });
    let handled = 0;

    const server = WebSocketServer.create<Name, Payload, Result>({
      path: '/rpc',
      cmd: {
        ns: 'test.ns.server',
        handlers: {
          ping: () => {
            handled += 1;
            return { ok: true };
          },
        },
      },
    });

    const ws = new WebSocket(server.url);
    const closed = Fixture.waitForClose(ws);

    try {
      await Net.waitFor(ws);
      const endpoint = Cmd.Transport.fromWebSocket(ws);
      const wrong = wrongCmd.client(endpoint, { timeout: 25 });
      try {
        const error = await wrong.send('ping', {}).catch((e: unknown) => e);
        Fixture.expectCmdError(error, 'CmdError.Timeout', 'ping');
        await Time.wait(0);
        expect(handled).to.eql(0);
      } finally {
        wrong.dispose();
      }

      const right = serverCmd.client(endpoint, { timeout: 1_000 });
      try {
        const result = await right.send('ping', {});
        expect(result).to.eql({ ok: true });
        expect(handled).to.eql(1);
      } finally {
        right.dispose();
      }
    } finally {
      Fixture.closeSocket(ws);
      await closed;
      await server.close('test.cleanup');
    }
  });
});
