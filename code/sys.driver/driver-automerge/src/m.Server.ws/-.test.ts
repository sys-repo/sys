import { describe, expect, it, Testing } from '../-test.ts';
import { Server } from './mod.ts';

describe('Crdt: Server', { sanitizeResources: false, sanitizeOps: false }, () => {
  const dir = '.tmp/test/CrdtServer';

  it('API', async () => {
    const m = await import('@sys/driver-automerge/ws');
    expect(m.Server).to.equal(Server);
  });

  it('start', async () => {
    const port = Testing.randomPort();
    const res = await Server.ws({ dir, port });
    expect(res.repo.id.peer.startsWith('peer.')).to.eql(true);
  });
});
