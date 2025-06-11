import { describe, expect, it, Testing } from '../-test.ts';
import { Server } from './mod.ts';

describe('Crdt: Server', { sanitizeResources: false, sanitizeOps: false }, () => {
  const dir = '.tmp/test/CrdtServer';

  it('start', async () => {
    const port = Testing.randomPort();
    const res = await Server.wss({ dir, port });
    expect(res.repo.id.peer.startsWith('peer:fs:')).to.eql(true);
  });
});
