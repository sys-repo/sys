import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { describe, expect, it, Time } from '../-test.ts';

describe('Crdt: broser', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };

  it('imports', async () => {
    const { Crdt } = await import('@sys/driver-automerge/browser');
    expect(Crdt.kind).to.eql('Crdt:Browser');

    const repoA = Crdt.repo({ storage: 'IndexedDb' });
    expect(repoA.id.peer.startsWith('peer.')).to.be.true;

    const a = repoA.create<T>({ count: 0 });
    a.change((d) => (d.count = 1234));

    await Time.wait(500);

    const repoB = Crdt.repo({ storage: new IndexedDBStorageAdapter() });
    const b = (await repoB.get<T>(a.id))!;
    expect(b.current).to.eql({ count: 1234 }); // NB: read from IndexedDb.
  });
});
