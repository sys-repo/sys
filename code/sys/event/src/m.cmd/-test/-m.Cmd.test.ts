import { type t, describe, expect, it, Schedule, Time } from '../../-test.ts';
import { Cmd } from '../mod.ts';

describe('Cmd: core command behavior', () => {
  it('Cmd.make returns a typed instance', () => {
    type Name = 'foo';
    type Payload = { foo: { n: number } };
    type Result = { foo: { ok: boolean } };

    const cmd = Cmd.make<Name, Payload, Result>();

    expect(cmd).to.be.an('object');
    expect(cmd.client).to.be.a('function');
    expect(cmd.host).to.be.a('function');
  });

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
      expect(res.reply).to.eql('HI');

      client.dispose();
      host.dispose();
    });
  });

  describe('streaming', () => {
    it('timeout rejects stream.done and stops delivering further events', async () => {
      type Name = 'ping';
      type Payload = { ping: { msg: string } };
      type Result = { ping: { reply: string } };
      type Events = { ping: { tick: number } };

      const cmd = Cmd.make<Name, Payload, Result, Events>();
      const { port1, port2 } = new MessageChannel();

      const client = cmd.client(port2, { timeout: 10 });

      const stream = client.stream('ping', { msg: 'hello' });
      const events: Events['ping'][] = [];

      const subscription = stream.onEvent((event) => {
        events.push(event);
      });

      // Event before timeout.
      port1.postMessage({
        kind: 'cmd:event',
        id: stream.id,
        name: 'ping',
        payload: { tick: 1 },
      });

      // Event after timeout should not be delivered.
      Time.delay(30, () => {
        port1.postMessage({
          kind: 'cmd:event',
          id: stream.id,
          name: 'ping',
          payload: { tick: 2 },
        });
      });

      let thrown: unknown;
      try {
        await stream.done;
        expect.fail('Expected stream.done to reject on timeout');
      } catch (e) {
        thrown = e;
      }

      const err = thrown as t.CmdError;
      expect(err).to.be.instanceOf(Error);
      expect(err.name).to.eql('CmdErrorTimeout');
      expect(err.message).to.contain('timed out');
      expect(err.cmd).to.be.an('object');
      expect(err.cmd?.name).to.eql('ping');
      expect(err.cmd?.id).to.be.a('string');
      expect(err.cmd?.id).to.match(/^req-/);
      expect(err.ns).to.eql(undefined);
      expect(err.cmd?.ns).to.eql(undefined);

      // Give the late event time to arrive if the handler were still attached.
      await Schedule.sleep(40);

      // Only the pre-timeout event should have been observed.
      expect(events).to.eql([{ tick: 1 }]);

      subscription.dispose();
      client.dispose();
      port1.close();
    });

    it('client.dispose rejects stream.done and detaches event subscriptions', async () => {
      type Name = 'ping';
      type Payload = { ping: { msg: string } };
      type Result = { ping: { ok: boolean } };
      type Events = { ping: { tick: number } };

      const cmd = Cmd.make<Name, Payload, Result, Events>();
      const { port1, port2 } = new MessageChannel();

      const client = cmd.client(port2);
      const stream = client.stream('ping', { msg: 'hello' });

      const events: Events['ping'][] = [];
      const subscription = stream.onEvent((event) => {
        events.push(event);
      });

      // First event before disposal should be observed.
      port1.postMessage({
        kind: 'cmd:event',
        id: stream.id,
        name: 'ping',
        payload: { tick: 1 },
      });

      // Allow the message loop to deliver the first event before teardown.
      await Schedule.sleep(5);
      expect(events).to.eql([{ tick: 1 }]);

      const awaitingDone = (async () => {
        let thrown: unknown;
        try {
          await stream.done;
          expect.fail('Expected stream.done to reject when client is disposed');
        } catch (e) {
          thrown = e;
        }

        const err = thrown as t.CmdError;
        expect(err).to.be.instanceOf(Error);
        expect(err.name).to.eql('CmdErrorClientDisposed');
        expect(err.message).to.contain('disposed');
        expect(err.cmd).to.eql(undefined);
        expect(err.ns).to.eql(undefined);
      })();

      // Dispose the client, triggering teardown.
      client.dispose();

      // Event after disposal should not be delivered to the handler.
      port1.postMessage({
        kind: 'cmd:event',
        id: stream.id,
        name: 'ping',
        payload: { tick: 2 },
      });

      await Schedule.sleep(10);
      // Still only the first event.
      expect(events).to.eql([{ tick: 1 }]);

      subscription.dispose();
      port1.close();
      await awaitingDone;
    });

    it('subscription dispose stops receiving further events for a stream', async () => {
      type Name = 'ping';
      type Payload = { ping: { msg: string } };
      type Result = { ping: { reply: string } };
      type Events = { ping: { tick: number } };

      const cmd = Cmd.make<Name, Payload, Result, Events>();
      const { port1, port2 } = new MessageChannel();

      const client = cmd.client(port2);
      const stream = client.stream('ping', { msg: 'hello' });

      const events: Events['ping'][] = [];
      const subscription = stream.onEvent((event) => {
        events.push(event);
      });

      // First event arrives while subscribed.
      port1.postMessage({
        kind: 'cmd:event',
        id: stream.id,
        name: 'ping',
        payload: { tick: 1 },
      });

      await Schedule.sleep(5);
      expect(events).to.eql([{ tick: 1 }]);

      // Dispose subscription, then send another event.
      subscription.dispose();

      port1.postMessage({
        kind: 'cmd:event',
        id: stream.id,
        name: 'ping',
        payload: { tick: 2 },
      });

      await Schedule.sleep(10);
      // No new events after subscription is disposed.
      expect(events).to.eql([{ tick: 1 }]);

      // Clean up the pending stream: allow rejection on dispose but swallow it.
      const done = stream.done.catch(() => {});
      client.dispose();
      port1.close();
      await done;
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

      let thrownError: unknown;
      try {
        await client.send('fail', {});
        expect.fail('Expected client.send to throw');
      } catch (e) {
        thrownError = e;
      }

      const err = thrownError as t.CmdError;
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.eql('boom');

      expect(err.name).to.eql('CmdErrorRemote');
      expect(err.cmd).to.be.an('object');
      expect(err.cmd?.name).to.eql('fail');
      expect(err.cmd?.id).to.be.a('string');
      expect(err.cmd?.id).to.match(/^req-/);

      // No namespace configured → ns should be undefined.
      expect(err.ns).to.eql(undefined);
      expect(err.cmd?.ns).to.eql(undefined);

      client.dispose();
      host.dispose();
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
      const p = client.send('bar', {});

      let thrownError: unknown;
      try {
        await p;
        expect.fail('Expected client.send to throw for unknown command');
      } catch (e) {
        thrownError = e;
      }

      const err = thrownError as t.CmdError;
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.match(/No handler registered for command "bar"/);

      expect(err.name).to.eql('CmdErrorRemote');
      expect(err.cmd).to.be.an('object');
      expect(err.cmd?.name).to.eql('bar');
      expect(err.cmd?.id).to.be.a('string');
      expect(err.cmd?.id).to.match(/^req-/);

      // No namespace configured → ns should be undefined.
      expect(err.ns).to.eql(undefined);
      expect(err.cmd?.ns).to.eql(undefined);

      client.dispose();
      host.dispose();
    });

    it('client timeout rejects pending request with CmdErrorTimeout and cmd meta', async () => {
      type Name = 'slow';
      type Payload = { slow: {} };
      type Result = { slow: {} };

      const cmd = Cmd.make<Name, Payload, Result>();
      const { port1, port2 } = new MessageChannel();

      const host = cmd.host(port1, {
        async slow() {
          /* Intentionally never resolve - ensure timeout error */
          await new Promise<never>(() => {});
        },
      });

      const client = cmd.client(port2, { timeout: 10 });
      const p = client.send('slow', {});

      let err: unknown;
      try {
        await p;
        expect.fail('Expected client.send to throw on timeout');
      } catch (e) {
        err = e;
      }

      expect(err).to.be.instanceOf(Error);
      const error = err as t.CmdError;
      expect(error.name).to.eql('CmdErrorTimeout');
      expect(error.message).to.contain('timed out');

      expect(error.cmd).to.be.an('object');
      expect(error.cmd?.name).to.eql('slow');
      expect(error.cmd?.id).to.be.a('string');
      expect(error.cmd?.id).to.match(/^req-/);

      // No namespace configured → ns should be undefined.
      expect(error.ns).to.eql(undefined);
      expect(error.cmd?.ns).to.eql(undefined);

      client.dispose();
      host.dispose();
    });
  });

  describe('lifecycle', () => {
    it('client.dispose rejects any pending requests', async () => {
      type Name = 'slow';
      type Payload = { slow: {} };
      type Result = { slow: {} };

      const cmd = Cmd.make<Name, Payload, Result>();
      const { port1, port2 } = new MessageChannel();

      const host = cmd.host(port1, {
        async slow() {
          await Schedule.sleep(50);
          return {};
        },
      });

      const client = cmd.client(port2);
      const p = client.send('slow', {});

      client.dispose();
      host.dispose(); // NB: required to stop Schedule.sleep()

      let thrownError: unknown;
      try {
        await p;
        expect.fail('Expected pending request to be rejected on dispose');
      } catch (e) {
        thrownError = e;
      }

      const err = thrownError as t.CmdError;
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.contain('disposed');

      expect(err.name).to.eql('CmdErrorClientDisposed');
      expect(err.cmd).to.eql(undefined);
      expect(err.ns).to.eql(undefined);
    });
  });

  describe('namespaces', () => {
    it('routes commands by ns on a shared MessageChannel', async () => {
      // Command set A
      type NameA = 'pingA';
      type PayloadA = { pingA: {} };
      type ResultA = { pingA: { reply: string } };

      // Command set B
      type NameB = 'pingB';
      type PayloadB = { pingB: {} };
      type ResultB = { pingB: { reply: string } };

      const nsA: t.CmdNamespace = 'ns/A';
      const nsB: t.CmdNamespace = 'ns/B';

      const cmdA = Cmd.make<NameA, PayloadA, ResultA>({ ns: nsA });
      const cmdB = Cmd.make<NameB, PayloadB, ResultB>({ ns: nsB });
      const { port1, port2 } = new MessageChannel();

      let calledA = 0;
      let calledB = 0;

      const hostA = cmdA.host(port1, {
        pingA() {
          calledA += 1;
          return { reply: 'A' };
        },
      });

      const hostB = cmdB.host(port1, {
        pingB() {
          calledB += 1;
          return { reply: 'B' };
        },
      });

      const clientA = cmdA.client(port2);
      const clientB = cmdB.client(port2);

      const resA = await clientA.send('pingA', {});
      const resB = await clientB.send('pingB', {});

      expect(resA.reply).to.eql('A');
      expect(resB.reply).to.eql('B');

      // Each host only handled its own namespace.
      expect(calledA).to.eql(1);
      expect(calledB).to.eql(1);

      clientA.dispose();
      clientB.dispose();
      hostA.dispose();
      hostB.dispose();
    });

    it('routes stream events by ns on a shared MessageChannel', async () => {
      // Command set A
      type NameA = 'pingA';
      type PayloadA = { pingA: {} };
      type ResultA = { pingA: { reply: string } };
      type EventsA = { pingA: { tick: number } };

      // Command set B
      type NameB = 'pingB';
      type PayloadB = { pingB: {} };
      type ResultB = { pingB: { reply: string } };
      type EventsB = { pingB: { tick: number } };

      const nsA: t.CmdNamespace = 'ns/A';
      const nsB: t.CmdNamespace = 'ns/B';

      const cmdA = Cmd.make<NameA, PayloadA, ResultA, EventsA>({ ns: nsA });
      const cmdB = Cmd.make<NameB, PayloadB, ResultB, EventsB>({ ns: nsB });

      const { port1, port2 } = new MessageChannel();
      const clientA = cmdA.client(port2);
      const clientB = cmdB.client(port2);

      const streamA = clientA.stream('pingA', {});
      const streamB = clientB.stream('pingB', {});

      const eventsA: EventsA['pingA'][] = [];
      const eventsB: EventsB['pingB'][] = [];
      const subA = streamA.onEvent((event) => eventsA.push(event));
      const subB = streamB.onEvent((event) => eventsB.push(event));

      // Event for nsA should only reach clientA.
      port1.postMessage({
        kind: 'cmd:event',
        ns: nsA,
        id: streamA.id,
        name: 'pingA',
        payload: { tick: 1 },
      });

      // Event for nsB should only reach clientB.
      port1.postMessage({
        kind: 'cmd:event',
        ns: nsB,
        id: streamB.id,
        name: 'pingB',
        payload: { tick: 10 },
      });

      await Schedule.sleep(10);

      expect(eventsA).to.eql([{ tick: 1 }]);
      expect(eventsB).to.eql([{ tick: 10 }]);

      // Clean up: handle pending stream.done rejections from client.dispose.
      const doneA = streamA.done.catch(() => {});
      const doneB = streamB.done.catch(() => {});

      subA.dispose();
      subB.dispose();
      clientA.dispose();
      clientB.dispose();
      port1.close();

      await doneA;
      await doneB;
    });

    it('attaches ns to CmdError when configured', async () => {
      type Name = 'fail';
      type Payload = { fail: {} };
      type Result = { fail: {} };

      const ns: t.CmdNamespace = 'worker/fail';

      const cmd = Cmd.make<Name, Payload, Result>({ ns });
      const { port1, port2 } = new MessageChannel();

      const host = cmd.host(port1, {
        fail() {
          throw new Error('ns-boom');
        },
      });

      const client = cmd.client(port2);

      let thrown: unknown;
      try {
        await client.send('fail', {});
        expect.fail('Expected client.send to throw');
      } catch (e) {
        thrown = e;
      }

      const err = thrown as t.CmdError;
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.eql('ns-boom');
      expect(err.name).to.eql('CmdErrorRemote');

      // Namespace is attached at the top level and within cmd meta.
      expect(err.ns).to.eql(ns);
      expect(err.cmd).to.be.an('object');
      expect(err.cmd?.name).to.eql('fail');
      expect(err.cmd?.id).to.be.a('string');
      expect(err.cmd?.id).to.match(/^req-/);
      expect(err.cmd?.ns).to.eql(ns);

      client.dispose();
      host.dispose();
    });
  });
});
