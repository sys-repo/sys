import { describe, expect, it } from '../../-test.ts';
import { Cmd } from '../mod.ts';

describe('Cmd:unary req/res → 👋 Hello World', () => {
  it('sample', async () => {
    // 1. Define command names + payload/result shapes.
    type Name = 'ping';
    type Payload = { ping: { msg: string } };
    type Result = { ping: { reply: string } };

    // 2. Instantiate a typed command set.
    const cmd = Cmd.make<Name, Payload, Result>();

    // 3. For the demo, create a MessageChannel (browser/WebWorker/WinterTG).
    const { port1, port2 } = new MessageChannel();

    // 4. Create the host on one side.
    const host = cmd.host(port1, {
      ping: async ({ msg }) => ({ reply: `pong: ${msg}` }),
    });

    // 5. Create the client on the other side.
    const client = cmd.client(port2);

    // 6. Send a typed command and assert the reply.
    const res = await client.send('ping', { msg: 'hello' });
    expect(res.reply).to.eql('pong: hello');

    // 7. Cleanup.
    client.dispose();
    host.dispose();
  });
});
