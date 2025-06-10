import { describe, expect, it, Testing } from '../-test.ts';
import { CrdtServer } from './mod.ts';

describe('CrdtServer', { sanitizeResources: false, sanitizeOps: false }, () => {
  const dir = '.tmp/test/CrdtServer';

  it('start', async () => {
    const port = Testing.randomPort();
    const res = await CrdtServer.start({ dir, port });
    expect(res.repo.id.peer.startsWith('peer:fs:')).to.eql(true);
  });
});
