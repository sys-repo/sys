import { type t, describe, expect, it, Schedule } from '../../-test.ts';
import { throwError } from 'rxjs';
import { Cmd } from '../mod.ts';

describe('Cmd (core)', () => {
  it('Cmd.make returns a typed instance', () => {
    type Name = 'foo';
    type Payload = { foo: { n: number } };
    type Result = { foo: { ok: boolean } };

    const cmd = Cmd.make<Name, Payload, Result>();

    expect(cmd).to.be.an('object');
    expect(cmd.client).to.be.a('function');
    expect(cmd.host).to.be.a('function');
  });

  describe('request/response', () => {
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

      host.dispose();
    });
  });
});
