import { Cmd } from '@sys/event/cmd';
import { describe, Err, expect, it } from '../-test.ts';
import { deliveryCheckpoint } from '../u/u.delivery.ts';

describe('Delivery fixture | a checkpoint controls one phase, not the command bus', () => {
  it('held handler → independent ping completes while the held effect remains unapplied', async () => {
    type Names = 'held' | 'ping';
    type Payload = { held: { value: string }; ping: Record<string, never> };
    type Result = { held: { value: string }; ping: { pong: true } };
    using checkpoint = deliveryCheckpoint();
    const cmd = Cmd.make<Names, Payload, Result>();
    let applied: string | undefined;
    const transport = Cmd.Transport.local({
      factory: cmd,
      handlers: {
        async held(payload) {
          await checkpoint.hold();
          applied = payload.value;
          return { value: applied };
        },
        ping: (): Result['ping'] => ({ pong: true }),
      },
    });
    const client = cmd.client(transport.endpoint, { timeout: 20_000 });
    const pending = client.send('held', { value: 'Held input' });
    try {
      await Promise.race([
        checkpoint.arrived,
        pending.then(() => {
          throw Err.std('Held command settled before checkpoint release.');
        }),
      ]);
      // A completed independent request supplies progress evidence without a sleep.
      expect(await client.send('ping', {})).to.eql({ pong: true });
      expect(applied).to.equal(undefined);
      checkpoint.release();
      expect(await pending).to.eql({ value: 'Held input' });
      expect(applied).to.equal('Held input');
    } finally {
      checkpoint.release();
      try {
        await pending;
      } finally {
        client.dispose();
        transport.dispose();
      }
    }
  });

  it('release or disposal → a one-shot checkpoint opens without inventing cancellation', async () => {
    const checkpoint = deliveryCheckpoint();
    const pending = checkpoint.hold();
    await checkpoint.arrived;
    checkpoint[Symbol.dispose]();
    checkpoint.release();
    await pending;
    // Re-entering an open checkpoint does not create a new generation or queue.
    await checkpoint.hold();
  });
});
