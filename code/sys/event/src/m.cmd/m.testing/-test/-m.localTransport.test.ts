import { describe, expect, it } from '../../../-test.ts';
import { Cmd } from '../../mod.ts';
import { CmdFixture } from '../mod.ts';

describe('CmdFixture.localTransport', () => {
  it('hosts handlers on a MessageChannel endpoint', async () => {
    const { factory, fixture } = setupEchoTransport();
    const client = factory.client(fixture.endpoint);

    try {
      expect(await client.send('echo', { msg: 'hello' })).to.eql({ reply: 'HELLO' });
      expect(fixture.host.disposed).to.eql(false);
    } finally {
      client.dispose();
      fixture.dispose();
    }
  });

  it('dispose forwards to the host lifecycle once', () => {
    const { fixture } = setupEchoTransport();
    let count = 0;
    fixture.host.dispose$.subscribe(() => count++);

    fixture.dispose('first');
    fixture.dispose('second');

    expect(fixture.host.disposed).to.eql(true);
    expect(count).to.eql(1);
  });
});

/**
 * Helpers:
 */
type EchoName = 'echo';
type EchoPayload = { echo: { msg: string } };
type EchoResult = { echo: { reply: string } };

function setupEchoTransport() {
  const factory = Cmd.make<EchoName, EchoPayload, EchoResult>({ ns: 'fixture/test' });
  const fixture = CmdFixture.localTransport({
    factory,
    handlers: {
      echo: (e) => ({ reply: e.msg.toUpperCase() }),
    },
  });

  return { factory, fixture };
}
