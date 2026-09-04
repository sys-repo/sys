import { describe, expect, it, Schedule } from '../../-test.ts';
import { Cmd } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('Cmd: streaming', () => {
  it('host ctx.emit → stream events before terminal result', async () => {
    type Name = 'ping';
    type Payload = { ping: { msg: string } };
    type Result = { ping: { reply: string } };
    type Events = { ping: { tick: number } };

    const cmd = Cmd.make<Name, Payload, Result, Events>();
    const { port1, port2 } = new MessageChannel();

    const host = cmd.host(port1, {
      async ping({ msg }, ctx) {
        await Schedule.sleep(1);
        ctx.emit({ tick: 1 });
        ctx.emit({ tick: 2 });
        return { reply: `pong: ${msg}` };
      },
    });

    const client = cmd.client(port2);
    const stream = client.stream('ping', { msg: 'hello' });

    const events: Events['ping'][] = [];
    const subscription = stream.onEvent((event) => events.push(event));
    const res = await stream.done;

    expect(res).to.eql({ reply: 'pong: hello' });
    expect(events).to.eql([{ tick: 1 }, { tick: 2 }]);
    expect(subscription.disposed).to.eql(true);

    client.dispose();
    host.dispose();
    port1.close();
    port2.close();
  });

  it('async iteration → yields stream events and completes on terminal result', async () => {
    type Name = 'ping';
    type Payload = { ping: {} };
    type Result = { ping: { done: true } };
    type Events = { ping: { tick: number } };

    const cmd = Cmd.make<Name, Payload, Result, Events>();
    const { port1, port2 } = new MessageChannel();

    const host = cmd.host(port1, {
      async ping(_payload, ctx) {
        await Schedule.sleep(1);
        ctx.emit({ tick: 1 });
        ctx.emit({ tick: 2 });
        return { done: true };
      },
    });

    const client = cmd.client(port2);
    const stream = client.stream('ping', {});
    const events: Events['ping'][] = [];

    const iterate = (async () => {
      for await (const event of stream) {
        events.push(event);
      }
    })();

    const res = await stream.done;
    await iterate;

    expect(res).to.eql({ done: true });
    expect(events).to.eql([{ tick: 1 }, { tick: 2 }]);

    client.dispose();
    host.dispose();
    port1.close();
    port2.close();
  });

  it('late stream consumers → no replayed events', async () => {
    type Name = 'ping';
    type Payload = { ping: {} };
    type Result = { ping: { done: true } };
    type Events = { ping: { tick: number } };

    const cmd = Cmd.make<Name, Payload, Result, Events>();
    const { port1, port2 } = new MessageChannel();

    const host = cmd.host(port1, {
      async ping(_payload, ctx) {
        await Schedule.sleep(1);
        ctx.emit({ tick: 1 });
        return { done: true };
      },
    });

    const client = cmd.client(port2);
    const stream = client.stream('ping', {});
    const res = await stream.done;

    const lateEvents: Events['ping'][] = [];
    const lateSubscription = stream.onEvent((event) => lateEvents.push(event));
    const lateNext = await stream[Symbol.asyncIterator]().next();

    expect(res).to.eql({ done: true });
    expect(lateSubscription.disposed).to.eql(true);
    expect(lateEvents).to.eql([]);
    expect(lateNext).to.eql({ done: true, value: undefined });

    client.dispose();
    host.dispose();
    port1.close();
    port2.close();
  });

  it('stream.dispose → rejects done, disposes event subscriptions, and aborts host work', async () => {
    type Name = 'slow';
    type Payload = { slow: {} };
    type Result = { slow: { ok: boolean } };
    type Events = { slow: { tick: number } };

    const cmd = Cmd.make<Name, Payload, Result, Events>();
    const { port1, port2 } = new MessageChannel();

    let startedResolve: () => void = () => {};
    const started = new Promise<void>((resolve) => {
      startedResolve = resolve;
    });
    let abortSeenResolve: () => void = () => {};
    const abortSeen = new Promise<void>((resolve) => {
      abortSeenResolve = resolve;
    });

    const host = cmd.host(port1, {
      slow(_payload, ctx) {
        startedResolve();
        return new Promise<Result['slow']>((resolve) => {
          ctx.signal.addEventListener(
            'abort',
            () => {
              abortSeenResolve();
              resolve({ ok: false });
            },
            { once: true },
          );
        });
      },
    });

    const client = cmd.client(port2);
    const stream = client.stream('slow', {});
    const subscription = stream.onEvent(() => {});
    const done = stream.done.catch((err: unknown) => err);

    await started;
    stream.dispose();
    expect(subscription.disposed).to.eql(true);

    const err = await done;
    Fixture.expectCmdError(err, 'CmdError.Cancelled');
    await abortSeen;

    client.dispose();
    host.dispose();
    port1.close();
    port2.close();
  });

  it('async iterator return → cancels the stream', async () => {
    type Name = 'slow';
    type Payload = { slow: {} };
    type Result = { slow: { ok: boolean } };
    type Events = { slow: { tick: number } };

    const cmd = Cmd.make<Name, Payload, Result, Events>();
    const { port1, port2 } = new MessageChannel();

    let abortSeenResolve: () => void = () => {};
    const abortSeen = new Promise<void>((resolve) => {
      abortSeenResolve = resolve;
    });

    const host = cmd.host(port1, {
      async slow(_payload, ctx) {
        await Schedule.sleep(1);
        ctx.emit({ tick: 1 });
        return await new Promise<Result['slow']>((resolve) => {
          ctx.signal.addEventListener(
            'abort',
            () => {
              abortSeenResolve();
              resolve({ ok: false });
            },
            { once: true },
          );
        });
      },
    });

    const client = cmd.client(port2);
    const stream = client.stream('slow', {});
    const iterator = stream[Symbol.asyncIterator]();

    const first = await iterator.next();
    expect(first).to.eql({ done: false, value: { tick: 1 } });

    const done = stream.done.catch((err: unknown) => err);
    const returned = await iterator.return?.();
    expect(returned).to.eql({ done: true, value: undefined });

    const err = await done;
    Fixture.expectCmdError(err, 'CmdError.Cancelled');
    await abortSeen;

    client.dispose();
    host.dispose();
    port1.close();
    port2.close();
  });
});
