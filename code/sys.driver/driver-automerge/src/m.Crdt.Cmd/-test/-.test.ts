import { describe, expect, it } from '../../-test.ts';
import { CrdtCmd } from '../mod.ts';

describe(`Crdt.Cmd (command RPC)`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-automerge/fs');
    expect(m.Crdt.Cmd).to.equal(CrdtCmd);
  });
});
