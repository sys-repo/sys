import 'fake-indexeddb/auto';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { AutomergeRepo, describe, expect, it } from '../mod.ts';

describe('CRDT: IndexedDB', { sanitizeResources: false, sanitizeOps: false }, () => {
  it('repo → persistence', async () => {
    type T = { msg?: string };
    const repo = new AutomergeRepo({ storage: new IndexedDBStorageAdapter() });

    // Create initial doc:
    const a = repo.create<T>({ msg: 'initial' });
    await a.whenReady();
    expect(a.doc()).to.eql({ msg: 'initial' });

    // Change:
    const msg = `hello-👋`;
    a.change((d) => (d.msg = msg));

    // Query the repo for the documents address.
    const b = await repo.find<T>(a.url);
    expect(b.doc()).to.eql({ msg });

    // Finish up.
    await repo.shutdown();
  });
});
