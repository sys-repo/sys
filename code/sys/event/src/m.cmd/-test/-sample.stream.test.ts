import { expect, describe, it } from '../../-test.ts';
import { Cmd } from '../mod.ts';

describe('Cmd:stream → 👋 Hello World', () => {
  it('sample: stream events then result', async () => {
    // 1. Define command names + payload/result shapes.
    type Name = 'ping';
    type Payload = { ping: { msg: string } };
    type Result = { ping: { reply: string } };

    // 2. Instantiate a typed command set.
    const cmd = Cmd.make<Name, Payload, Result>();

    // 3. Create a MessageChannel (browser/WebWorker/WinterTG).
    const { port1, port2 } = new MessageChannel();

    // 4. Create the client on one side.
    const client = cmd.client(port2);

    // 5. Start a streaming command.
    const stream = client.stream('ping', { msg: 'hello' });
    const events: { tick: number }[] = [];

    const subscription = stream.onEvent((event) => {
      events.push(event as { tick: number });
    });

    // 6. Simulate the host sending mid-stream events, then a final result.
    port1.postMessage({ kind: 'cmd:event', id: stream.id, name: 'ping', payload: { tick: 1 } });
    port1.postMessage({ kind: 'cmd:event', id: stream.id, name: 'ping', payload: { tick: 2 } });

    port1.postMessage({
      kind: 'cmd:result',
      id: stream.id,
      name: 'ping',
      payload: { reply: 'pong: hello' },
    });

    // 7. Await the terminal result and assert the full flow.
    const res = await stream.done;

    expect(res.reply).to.eql('pong: hello');
    expect(events).to.eql([{ tick: 1 }, { tick: 2 }]);

    // 8. Cleanup.
    subscription.dispose();
    client.dispose();
    port1.close();
  });
});
