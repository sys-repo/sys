import { slug, describe, expect, it, Testing } from '../-test.ts';
import { Server } from './mod.ts';
import { Fs, Time } from './common.ts';

describe('Crdt: Server', { sanitizeResources: false, sanitizeOps: false }, () => {
  it('API', async () => {
    const m = await import('@sys/driver-automerge/server');
    expect(m.Server).to.equal(Server);
  });

  it('start', async () => {
    const dir = `.tmp/test/${slug()}.crdt`;
    const port = Testing.randomPort();
    const res = await Server.ws({ dir, port });
    expect(res.repo.id.peer.startsWith('peer.')).to.eql(true);

    await Time.wait(50);
    expect(await Fs.exists(dir)).to.eql(true);
  });
});
