import { describe, expect, it } from '../../../-test.ts';
import { Cmd } from '../../mod.ts';

describe('Cmd.Transport.local', () => {
  it('hosts handlers on a MessageChannel endpoint', async () => {
    const { factory, transport } = setupEchoTransport();
    const client = factory.client(transport.endpoint);

    try {
      expect(await client.send('echo', { msg: 'hello' })).to.eql({ reply: 'HELLO' });
      expect(transport.host.disposed).to.eql(false);
    } finally {
      client.dispose();
      transport.dispose();
    }
  });

  it('dispose forwards to the host lifecycle once', () => {
    const { transport } = setupEchoTransport();
    let count = 0;
    transport.host.dispose$.subscribe(() => count++);

    transport.dispose('first');
    transport.dispose('second');

    expect(transport.host.disposed).to.eql(true);
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
  const factory = Cmd.make<EchoName, EchoPayload, EchoResult>({ ns: 'transport/test' });
  const transport = Cmd.Transport.local({
    factory,
    handlers: {
      echo: (e) => ({ reply: e.msg.toUpperCase() }),
    },
  });

  return { factory, transport };
}
