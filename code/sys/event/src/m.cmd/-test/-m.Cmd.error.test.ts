import { describe, expect, it } from '../../-test.ts';
import { Cmd } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('Cmd: errors', () => {
  it('host error → propagates to client as remote CmdError', async () => {
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

    const error = Fixture.expectCmdError(err, 'CmdError.Remote');
    expect(error.message).to.eql('boom');
    expect(error.cmd?.name).to.eql('fail');
    expect(error.cmd?.id).to.match(/^req-/);
    expect(error.ns).to.eql(undefined);

    client.dispose();
    host.dispose();
    port1.close();
    port2.close();
  });

  it('empty remote error message → still rejects', async () => {
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

    const error = Fixture.expectCmdError(err, 'CmdError.Remote');
    expect(error.message).to.eql('');
    expect(error.cmd?.name).to.eql('fail');

    client.dispose();
    host.dispose();
    port1.close();
    port2.close();
  });

  it('unknown command → remote CmdError', async () => {
    type Name = 'foo';
    type Payload = { foo: {} };
    type Result = { foo: {} };

    const cmd = Cmd.make<Name, Payload, Result>();
    const { port1, port2 } = new MessageChannel();

    const host = cmd.host(port1, { foo: () => ({}) });
    const client = cmd.client(port2);

    // @ts-expect-error name is wrong — runtime should error too.
    const err = await client.send('bar', {}).catch((err: unknown) => err);

    const error = Fixture.expectCmdError(err, 'CmdError.Remote');
    expect(error.message).to.match(/No handler registered for command "bar"/);
    expect(error.cmd?.name).to.eql('bar');
    expect(error.cmd?.id).to.match(/^req-/);

    client.dispose();
    host.dispose();
    port1.close();
    port2.close();
  });
});
