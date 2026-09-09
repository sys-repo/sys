import { Cmd, describe, expect, it, Net, Time } from '../../-test.ts';
import { WebSocketServer } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('WebSocketServer/Cmd examples', () => {
  it('drives unary methods and streamed events over one WebSocket server', async () => {
    type Name = 'math.add' | 'counter.run';
    type Payload = {
      'math.add': { left: number; right: number };
      'counter.run': { to: number };
    };
    type Result = {
      'math.add': { total: number };
      'counter.run': { done: true };
    };
    type Event = {
      'math.add': never;
      'counter.run': { tick: number };
    };

    const ns = 'examples.cmd';
    const cmd = Cmd.make<Name, Payload, Result, Event>({ ns });
    const server = WebSocketServer.create<Name, Payload, Result, Event>({
      path: '/rpc',
      cmd: {
        ns,
        handlers: {
          'math.add': ({ left, right }) => ({ total: left + right }),
          async 'counter.run'({ to }, ctx) {
            for (let tick = 1; tick <= to; tick++) {
              ctx.emit({ tick });
              await Time.wait(0);
            }
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
        const sum = await client.send('math.add', { left: 20, right: 22 });
        expect(sum).to.eql({ total: 42 });

        const events: Event['counter.run'][] = [];
        const stream = client.stream('counter.run', { to: 3 });
        const subscription = stream.onEvent((event) => events.push(event));
        try {
          const done = await stream.done;
          expect(done).to.eql({ done: true });
          expect(events).to.eql([{ tick: 1 }, { tick: 2 }, { tick: 3 }]);
        } finally {
          subscription.dispose();
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

  it('rejects commands started after Cmd client disposal without hitting the server', async () => {
    type Name = 'ping';
    type Payload = { ping: {} };
    type Result = { ping: { ok: true } };
    type Event = { ping: { tick: number } };

    const ns = 'examples.disposed';
    const cmd = Cmd.make<Name, Payload, Result, Event>({ ns });
    let handled = 0;

    const server = WebSocketServer.create<Name, Payload, Result, Event>({
      path: '/rpc',
      cmd: {
        ns,
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
      const client = cmd.client(Cmd.Transport.fromWebSocket(ws), { timeout: 1_000 });
      client.dispose();

      const sendErr = await client.send('ping', {}).catch((error: unknown) => error);
      Fixture.expectCmdError(sendErr, 'CmdError.ClientDisposed', 'ping');

      const stream = client.stream('ping', {});
      const streamErr = await stream.done.catch((error: unknown) => error);
      Fixture.expectCmdError(streamErr, 'CmdError.ClientDisposed', 'ping');

      const subscription = stream.onEvent(() => {});
      expect(subscription.disposed).to.eql(true);
      expect(handled).to.eql(0);
    } finally {
      Fixture.closeSocket(ws);
      await closed;
      await server.close('test.cleanup');
    }
  });
});
