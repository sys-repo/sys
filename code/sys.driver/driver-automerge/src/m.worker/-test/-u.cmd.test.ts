import { describe, expect, it } from '../../-test.ts';
import { type t } from '../common.ts';
import { CrdtWorker } from '../mod.ts';

describe('Crdt.Worker.Cmd (RPC)', () => {
  it('Cmd: attach roundtrip over a bare MessageChannel', async () => {
    // 1. Instantiate a typed command set for the worker control channel.
    const cmd = CrdtWorker.Cmd.make();

    // 2. Create a MessageChannel to simulate worker <-> main boundary.
    const { port1, port2 } = new MessageChannel();

    // 3. Host: handle `attach` on one side.
    let receivedConfig: t.CrdtWorkerCmdPayload['attach']['config'] | undefined;

    const host = cmd.host(port1, {
      attach: ({ config }) => {
        receivedConfig = config;
        return { ok: true };
      },
    });

    // 4. Client: send `attach` from the other side.
    const client = cmd.client(port2);

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
