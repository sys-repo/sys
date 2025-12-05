import { type t, describe, expect, it, Schedule } from '../../-test.ts';
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
