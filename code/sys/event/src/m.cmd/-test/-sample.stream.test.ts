import { expect, describe, it, Schedule } from '../../-test.ts';
import { Cmd } from '../mod.ts';

describe('Cmd:stream → 👋 Hello World', () => {
  it('sample: host emits stream events then result', async () => {
    // 1. Define command names + payload/result/event shapes.
    type Name = 'ping';
    type Payload = { ping: { msg: string } };
    type Result = { ping: { reply: string } };
    type Events = { ping: { tick: number } };

    // 2. Instantiate a typed command set (including event payloads).
    const cmd = Cmd.make<Name, Payload, Result, Events>();

    // 3. Create a MessageChannel (browser/WebWorker/WinterTC).
    const { port1, port2 } = new MessageChannel();

    // 4. Create the host on one side.
    const host = cmd.host(port1, {
      async ping({ msg }, ctx) {
        await Schedule.sleep(1);
        ctx.emit({ tick: 1 });
        ctx.emit({ tick: 2 });
        return { reply: `pong: ${msg}` };
      },
    });

    // 5. Create the client on the other side.
    const client = cmd.client(port2);

    // 6. Start a streaming command.
    const stream = client.stream('ping', { msg: 'hello' });
    const events: Events['ping'][] = [];
    const subscription = stream.onEvent((event) => events.push(event));

    // Async iteration over the same event stream is also supported.
    const iterated: Events['ping'][] = [];
    const iterate = (async () => {
      for await (const event of stream) {
        iterated.push(event);
      }
    })();

    // 7. Await the terminal result and assert the full flow.
    const res = await stream.done;
    await iterate;

    expect(res.reply).to.eql('pong: hello');
    expect(events).to.eql([{ tick: 1 }, { tick: 2 }]);
    expect(iterated).to.eql([{ tick: 1 }, { tick: 2 }]);

    // 8. Cleanup.
    subscription.dispose();
    client.dispose();
    host.dispose();
    port1.close();
    port2.close();
  });
});
