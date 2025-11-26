import { describe, expect, it } from '../../-test.ts';
import { CrdtCmd } from '../mod.ts';
import { Crdt, Fixture } from './-u.ts';

describe('Crdt.Cmd.attachHost', () => {
  it('exposes repo commands over the attached endpoint', async () => {
    const repo = Crdt.repo();
    const { port1, port2 } = new MessageChannel();
    const endpoint = Fixture.makeEndpoint(port1);

    // Attach host for this repo to the endpoint.
    CrdtCmd.attachHost(repo, endpoint);

    // Client on the other side of the channel.
    const cmd = CrdtCmd.make();
    const client = cmd.client(port2);

    type D = { foo: number };
    const created = await repo.create<D>({ foo: 0 });
    if (!created.ok) throw new Error(`create failed: ${created.error.message}`);

    const doc = created.doc;
    const stats = await client.send('doc:stats', { doc: doc.id });

    expect(stats.bytes, 'bytes').to.be.greaterThan(0);
    expect(stats.total.changes, 'changes').to.be.greaterThan(0);
    expect(stats.total.ops, 'ops').to.be.greaterThan(0);

    client.dispose();
    await repo.dispose();
    endpoint.close?.();
  });

  it('closes the endpoint when the repo is disposed', async () => {
    const repo = Crdt.repo();
    const { port1, port2 } = new MessageChannel();
    let closeCount = 0;

    // Endpoint with a close hook.
    const endpoint = Fixture.makeEndpointWithCloseHook(port1, () => closeCount++);

    CrdtCmd.attachHost(repo, endpoint);
    const cmd = CrdtCmd.make();
    const client = cmd.client(port2);

    // Prove it works before disposal.
    type D = { foo: number };
    const created = await repo.create<D>({ foo: 1 });
    if (!created.ok) throw new Error(`create failed: ${created.error.message}`);

    const doc = created.doc;
    await client.send('doc:stats', { doc: doc.id });

    // Dispose the repo → should trigger endpoint.close().
    await repo.dispose();
    expect(closeCount).to.eql(1);

    client.dispose();
  });
});
