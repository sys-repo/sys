import { describe, expect, it } from '../../-test.ts';
import { type t, Cmd } from '../common.ts';

describe('Crdt.Worker.Cmd (Cmd bus)', () => {
  it('attach command roundtrip over MessageChannel', async () => {
    // 1. Instantiate a typed command set for the worker control channel.
    const workerCmd = Cmd.make<
      t.CrdtWorkerCmdName,
      t.CrdtWorkerCmdPayload,
      t.CrdtWorkerCmdResult
    >();

    // 2. Create a MessageChannel to simulate worker <-> main boundary.
    const { port1, port2 } = new MessageChannel();

    // 3. Host: handle `attach` on one side.
    let receivedConfig: t.CrdtWorkerCmdPayload['attach']['config'] | undefined;

    const host = workerCmd.host(port1, {
      attach: ({ config }) => {
        receivedConfig = config;
        return { ok: true };
      },
    });

    // 4. Client: send `attach` from the other side.
    const client = workerCmd.client(port2);

    const config: t.CrdtWorkerCmdPayload['attach']['config'] = {
      kind: 'fs',
      storage: '.tmp/test-crdt-worker-cmd',
      network: [],
      silent: true,
    };

    const res = await client.send('attach', { config });

    // 5. Assertions.
    expect(res).to.eql({ ok: true });
    expect(receivedConfig).to.eql(config);

    // 6. Cleanup (ensures no MessagePort leaks).
    client.dispose();
    host.dispose();
  });
});
