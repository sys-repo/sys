import { describe, expect, it } from '../../-test.ts';
import { CmdIs } from '../m.Is.ts';
import { Cmd } from '../mod.ts';
import { fromWebSocket } from '../transport/mod.ts';

describe(`Cmd: Command (Bus)`, () => {
  it('API', async () => {
    const m = await import('@sys/event/cmd');
    expect(m.Cmd).to.equal(Cmd);
    expect(m.Cmd.Is).to.equal(CmdIs);
    expect(m.Cmd.Transport.fromWebSocket).to.equal(fromWebSocket);
  });

  describe('👋 Hello World', () => {
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

      // 6. Send a typed command.
      const run = async () => {
        const res = await client.send('ping', { msg: 'hello' });
        console.info(res.reply); // → "pong: hello"

        // cleanup:
        client.dispose();
        host.dispose();
      };

      run();
    });
  });
});
