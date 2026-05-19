import { describe, expect, it, Schedule, type t } from '../../-test.ts';
import { Cmd } from '../mod.ts';

describe('Cmd: core command behavior', () => {
  describe('unary: request/response', () => {
    it('roundtrip → success', async () => {
      type Name = 'echo';
      type Payload = { echo: { msg: string } };
      type Result = { echo: { reply: string } };

      const cmd = Cmd.make<Name, Payload, Result>();
      const { port1, port2 } = new MessageChannel();

      const host = cmd.host(port1, {
        echo: ({ msg }) => ({ reply: msg.toUpperCase() }),
      });

      const client = cmd.client(port2);
      const res = await client.send('echo', { msg: 'hi' });
      expect(res).to.eql({ reply: 'HI' });

      client.dispose();
      host.dispose();
      port1.close();
      port2.close();
    });

    it('host handler receives request context', async () => {
      type Name = 'inspect';
      type Payload = { inspect: { value: number } };
      type Result = { inspect: { ok: boolean; value: number } };

      const ns: t.Cmd.Namespace = 'ctx/ns';
      const cmd = Cmd.make<Name, Payload, Result>({ ns });
      const { port1, port2 } = new MessageChannel();

      let context: {
        readonly id: t.Cmd.ReqId;
        readonly name: Name;
        readonly ns?: t.Cmd.Namespace;
        readonly aborted: boolean;
        readonly emit: 'function' | 'other';
      } | undefined;

      const host = cmd.host(port1, {
        inspect(payload, ctx) {
          context = {
            id: ctx.id,
            name: ctx.name,
            ns: ctx.ns,
            aborted: ctx.signal.aborted,
            emit: typeof ctx.emit === 'function' ? 'function' : 'other',
          };
          return { ok: true, value: payload.value };
        },
      });

      const client = cmd.client(port2);
      const res = await client.send('inspect', { value: 123 });

      expect(res).to.eql({ ok: true, value: 123 });
      expect(context?.id).to.match(/^req-/);
      expect(context?.name).to.eql('inspect');
      expect(context?.ns).to.eql(ns);
      expect(context?.aborted).to.eql(false);
      expect(context?.emit).to.eql('function');

      client.dispose();
      host.dispose();
      port1.close();
      port2.close();
    });
  });

  describe('streaming', () => {
    it('host ctx.emit delivers stream events before terminal result', async () => {
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

      subscription.dispose();
      client.dispose();
      host.dispose();
      port1.close();
      port2.close();
    });

    it('async iteration yields stream events and completes on terminal result', async () => {
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

    it('late stream consumers do not receive replayed events', async () => {
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

    it('stream.dispose rejects done with CmdError.Cancelled and aborts host work', async () => {
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
      const done = stream.done.catch((err: unknown) => err);

      await started;
      stream.dispose();

      const err = await done;
      expectCmdError(err, 'CmdError.Cancelled');
      await abortSeen;

      client.dispose();
      host.dispose();
      port1.close();
      port2.close();
    });

    it('async iterator return cancels the stream', async () => {
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
      expectCmdError(err, 'CmdError.Cancelled');
      await abortSeen;

      client.dispose();
      host.dispose();
      port1.close();
      port2.close();
    });

    it('timeout rejects pending request and sends cancel to host', async () => {
      type Name = 'slow';
      type Payload = { slow: {} };
      type Result = { slow: { ok: boolean } };

      const cmd = Cmd.make<Name, Payload, Result>();
      const { port1, port2 } = new MessageChannel();

      let abortSeenResolve: () => void = () => {};
      const abortSeen = new Promise<void>((resolve) => {
        abortSeenResolve = resolve;
      });

      const host = cmd.host(port1, {
        slow(_payload, ctx) {
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

      const client = cmd.client(port2, { timeout: 10 });
      const res = await client.send('slow', {}).catch((err: unknown) => err);

      const err = expectCmdError(res, 'CmdError.Timeout');
      expect(err.message).to.contain('timed out');
      expect(err.cmd?.name).to.eql('slow');
      expect(err.cmd?.id).to.match(/^req-/);
      await abortSeen;

      client.dispose();
      host.dispose();
      port1.close();
      port2.close();
    });

    it('client.dispose rejects pending requests and sends cancel to host', async () => {
      type Name = 'slow';
      type Payload = { slow: {} };
      type Result = { slow: { ok: boolean } };

      const cmd = Cmd.make<Name, Payload, Result>();
      const { port1, port2 } = new MessageChannel();

      let abortSeenResolve: () => void = () => {};
      const abortSeen = new Promise<void>((resolve) => {
        abortSeenResolve = resolve;
      });

      const host = cmd.host(port1, {
        slow(_payload, ctx) {
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
      const pending = client.send('slow', {}).catch((err: unknown) => err);

      client.dispose();

      const err = await pending;
      expectCmdError(err, 'CmdError.ClientDisposed');
      await abortSeen;

      host.dispose();
      port1.close();
      port2.close();
    });
  });

  describe('errors', () => {
    it('host error propagates to client', async () => {
      type Name = 'fail';
      type Payload = { fail: {} };
      type Result = { fail: {} };

      const cmd = Cmd.make<Name, Payload, Result>();
      const { port1, port2 } = new MessageChannel();

      const host = cmd.host(port1, {
        fail() {
          throw new Error('boom');
        },
      });

      const client = cmd.client(port2);
      const err = await client.send('fail', {}).catch((err: unknown) => err);

      const error = expectCmdError(err, 'CmdError.Remote');
      expect(error.message).to.eql('boom');
      expect(error.cmd?.name).to.eql('fail');
      expect(error.cmd?.id).to.match(/^req-/);
      expect(error.ns).to.eql(undefined);

      client.dispose();
      host.dispose();
      port1.close();
      port2.close();
    });

    it('empty remote error message still rejects', async () => {
      type Name = 'fail';
      type Payload = { fail: {} };
      type Result = { fail: {} };

      const cmd = Cmd.make<Name, Payload, Result>();
      const { port1, port2 } = new MessageChannel();

      const host = cmd.host(port1, {
        fail() {
          throw new Error('');
        },
      });

      const client = cmd.client(port2);
      const err = await client.send('fail', {}).catch((err: unknown) => err);

      const error = expectCmdError(err, 'CmdError.Remote');
      expect(error.message).to.eql('');
      expect(error.cmd?.name).to.eql('fail');

      client.dispose();
      host.dispose();
      port1.close();
      port2.close();
    });

    it('unknown command → error', async () => {
      type Name = 'foo';
      type Payload = { foo: {} };
      type Result = { foo: {} };

      const cmd = Cmd.make<Name, Payload, Result>();
      const { port1, port2 } = new MessageChannel();

      const host = cmd.host(port1, { foo: () => ({}) });
      const client = cmd.client(port2);

      // @ts-expect-error name is wrong — runtime should error too.
      const err = await client.send('bar', {}).catch((err: unknown) => err);

      const error = expectCmdError(err, 'CmdError.Remote');
      expect(error.message).to.match(/No handler registered for command "bar"/);
      expect(error.cmd?.name).to.eql('bar');
      expect(error.cmd?.id).to.match(/^req-/);

      client.dispose();
      host.dispose();
      port1.close();
      port2.close();
    });
  });

  describe('lifecycle and transport ownership', () => {
    it('dispose removes listeners but keeps endpoints open by default', () => {
      type Name = 'ping';
      type Payload = { ping: {} };
      type Result = { ping: {} };

      const cmd = Cmd.make<Name, Payload, Result>();
      const { port1, port2 } = new MessageChannel();
      const endpoint1 = trackEndpoint(port1);
      const endpoint2 = trackEndpoint(port2);

      const host = cmd.host(endpoint1, { ping: () => ({}) });
      const client = cmd.client(endpoint2);

      client.dispose();
      host.dispose();

      expect(endpoint1.closed()).to.eql(0);
      expect(endpoint2.closed()).to.eql(0);

      port1.close();
      port2.close();
    });

    it('host.dispose settles active requests with a remote error', async () => {
      type Name = 'slow';
      type Payload = { slow: {} };
      type Result = { slow: { ok: boolean } };

      const cmd = Cmd.make<Name, Payload, Result>();
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
      const pending = client.send('slow', {}).catch((err: unknown) => err);

      await started;
      host.dispose();

      const err = await pending;
      const error = expectCmdError(err, 'CmdError.Remote');
      expect(error.message).to.eql('Command host disposed before response was sent.');
      expect(error.cmd?.name).to.eql('slow');
      expect(error.cmd?.id).to.match(/^req-/);
      await abortSeen;

      client.dispose();
      port1.close();
      port2.close();
    });

    it('client rejects commands started after dispose', async () => {
      type Name = 'ping';
      type Payload = { ping: {} };
      type Result = { ping: { ok: boolean } };
      type Events = { ping: { tick: number } };

      const cmd = Cmd.make<Name, Payload, Result, Events>();
      const { port1, port2 } = new MessageChannel();
      const client = cmd.client(port2);

      client.dispose();

      const sendErr = await client.send('ping', {}).catch((err: unknown) => err);
      const sendError = expectCmdError(sendErr, 'CmdError.ClientDisposed');
      expect(sendError.cmd?.name).to.eql('ping');
      expect(sendError.cmd?.id).to.match(/^req-/);

      const stream = client.stream('ping', {});
      const streamErr = await stream.done.catch((err: unknown) => err);
      const streamError = expectCmdError(streamErr, 'CmdError.ClientDisposed');
      expect(streamError.cmd?.name).to.eql('ping');
      expect(streamError.cmd?.id).to.match(/^req-/);

      const iteratorErr = await stream[Symbol.asyncIterator]().next().catch((err: unknown) => err);
      expectCmdError(iteratorErr, 'CmdError.ClientDisposed');

      const subscription = stream.onEvent(() => {});
      expect(subscription.disposed).to.eql(true);

      port1.close();
      port2.close();
    });

    it('closeEndpoint opts into endpoint closing', () => {
      type Name = 'ping';
      type Payload = { ping: {} };
      type Result = { ping: {} };

      const cmd = Cmd.make<Name, Payload, Result>();
      const { port1, port2 } = new MessageChannel();
      const endpoint1 = trackEndpoint(port1);
      const endpoint2 = trackEndpoint(port2);

      const host = cmd.host(endpoint1, { ping: () => ({}) }, { closeEndpoint: true });
      const client = cmd.client(endpoint2, { closeEndpoint: true });

      client.dispose();
      host.dispose();

      expect(endpoint1.closed()).to.eql(1);
      expect(endpoint2.closed()).to.eql(1);
    });
  });

  describe('namespaces', () => {
    it('matches namespaces exactly on a shared MessageChannel', async () => {
      type Name = 'ping';
      type Payload = { ping: {} };
      type Result = { ping: { reply: string } };

      const ns: t.Cmd.Namespace = 'ns/exact';
      const plain = Cmd.make<Name, Payload, Result>();
      const named = Cmd.make<Name, Payload, Result>({ ns });
      const { port1, port2 } = new MessageChannel();

      let plainCalled = 0;
      let namedCalled = 0;

      const plainHost = plain.host(port1, {
        ping() {
          plainCalled += 1;
          return { reply: 'plain' };
        },
      });
      const namedHost = named.host(port1, {
        ping() {
          namedCalled += 1;
          return { reply: 'named' };
        },
      });

      const plainClient = plain.client(port2);
      const namedClient = named.client(port2);

      const namedRes = await namedClient.send('ping', {});
      const plainRes = await plainClient.send('ping', {});

      expect(namedRes).to.eql({ reply: 'named' });
      expect(plainRes).to.eql({ reply: 'plain' });
      expect(namedCalled).to.eql(1);
      expect(plainCalled).to.eql(1);

      plainClient.dispose();
      namedClient.dispose();
      plainHost.dispose();
      namedHost.dispose();
      port1.close();
      port2.close();
    });

    it('attaches ns to CmdError when configured', async () => {
      type Name = 'fail';
      type Payload = { fail: {} };
      type Result = { fail: {} };

      const ns: t.Cmd.Namespace = 'worker/fail';
      const cmd = Cmd.make<Name, Payload, Result>({ ns });
      const { port1, port2 } = new MessageChannel();

      const host = cmd.host(port1, {
        fail() {
          throw new Error('ns-boom');
        },
      });

      const client = cmd.client(port2);
      const err = await client.send('fail', {}).catch((err: unknown) => err);

      const error = expectCmdError(err, 'CmdError.Remote');
      expect(error.message).to.eql('ns-boom');
      expect(error.ns).to.eql(ns);
      expect(error.cmd?.name).to.eql('fail');
      expect(error.cmd?.id).to.match(/^req-/);
      expect(error.cmd?.ns).to.eql(ns);

      client.dispose();
      host.dispose();
      port1.close();
      port2.close();
    });
  });
});

/**
 * Helpers:
 */
function expectCmdError(input: unknown, kind: t.Cmd.Error.Kind) {
  expect(input).to.be.instanceOf(Error);

  const err = input as t.Cmd.Error.Instance;
  expect(err.name).to.eql(kind);
  return err;
}

function trackEndpoint(port: MessagePort) {
  let closed = 0;

  return {
    postMessage(data: unknown) {
      port.postMessage(data);
    },
    addEventListener(type: 'message', handler: (event: MessageEvent) => void) {
      port.addEventListener(type, handler);
    },
    removeEventListener(type: 'message', handler: (event: MessageEvent) => void) {
      port.removeEventListener(type, handler);
    },
    start() {
      port.start();
    },
    close() {
      closed += 1;
      port.close();
    },
    closed: () => closed,
  } satisfies t.Cmd.Endpoint & { readonly closed: () => number };
}
