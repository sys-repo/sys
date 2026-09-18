import { describe, expect, it, type t } from '../../-test.ts';
import { Cmd } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('Cmd: namespaces', () => {
  it('shared endpoint → matches namespaces exactly', async () => {
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

  it('configured namespace → attaches ns to CmdError', async () => {
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

    const error = Fixture.expectCmdError(err, 'CmdError.Remote');
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
