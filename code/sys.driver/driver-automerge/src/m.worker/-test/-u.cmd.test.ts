import { describe, expect, it, slug } from '../../-test.ts';
import { type t, Cmd } from '../common.ts';

describe('Crdt.Worker.Cmd (RPC)', () => {
  it('attach roundtrip over a bare MessageChannel', async () => {
    //
    // 1. Instantiate a typed command set for the worker control channel.
    type Name = 'attach';
    type Payload = Pick<t.CrdtCmdPayload, Name>;
    type Result = Pick<t.CrdtCmdResult, Name>;

    const cmd = Cmd.make<Name, Payload, Result>();

    //
    // 2. Create a MessageChannel to simulate worker ←→ main boundary.
    const { port1, port2 } = new MessageChannel();

    //
    // 3. Host: handle `attach` on one side (ie. in the worker).
    let receivedConfig: t.CrdtCmdPayload['attach']['config'] | undefined;

    const host = cmd.host(port1, {
      /** Strongly typed method: */
      attach: async ({ config }) => {
        receivedConfig = config;
        return { ok: true };
      },
    });

    // 4. Client: send `attach` from the other side.
    const client = cmd.client(port2);

    const config: t.CrdtCmdPayload['attach']['config'] = {
      kind: 'fs',
      storage: `.tmp/test/sample/${slug()}`,
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
