import { describe, expect, it } from '../../-test.ts';
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
      expect(res.reply).to.equal('HI');

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
        fail: () => {
          throw new Error('boom');
        },
      });

      const client = cmd.client(port2);

      let err: unknown;
      try {
        await client.send('fail', {});
        expect.fail('Expected client.send to throw');
      } catch (e) {
        err = e;
      }

      expect(err).to.be.instanceOf(Error);
      expect((err as Error).message).to.equal('boom');

      client.dispose();
      host.dispose();
    });

    it('unknown command → error', async () => {
      type Name = 'foo';
      type Payload = { foo: {} };
      type Result = { foo: {} };

      const cmd = Cmd.make<Name, Payload, Result>();
      const { port1, port2 } = new MessageChannel();

      const host = cmd.host(port1, {
        foo: () => ({}),
      });

      const client = cmd.client(port2);

      // @ts-expect-error name is wrong — runtime should error too.
      const p = client.send('bar', {});

      let err: unknown;
      try {
        await p;
        expect.fail('Expected client.send to throw for unknown command');
      } catch (e) {
        err = e;
      }

      expect(err).to.be.instanceOf(Error);
      expect((err as Error).message).to.match(/No handler registered for command "bar"/);

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
        slow: async () => {
          await new Promise((r) => setTimeout(r, 50));
          return {};
        },
      });

      const client = cmd.client(port2);
      const p = client.send('slow', {});
      client.dispose();

      let err: unknown;
      try {
        await p;
        expect.fail('Expected pending request to be rejected on dispose');
      } catch (e) {
        err = e;
      }

      expect(err).to.be.instanceOf(Error);
      expect((err as Error).message).to.contain('disposed');

      host.dispose();
    });
  });
});
