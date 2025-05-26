import { Repo } from '@automerge/automerge-repo';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import 'fake-indexeddb/auto';
import { describe, expect, it, Testing } from '../-test.ts';

describe('CRDT: web (browser)', { sanitizeResources: false, sanitizeOps: false }, () => {
  describe('raw: underlying automerge library', () => {
    it('repo → persistence: IndexedDB', async () => {
      type T = { msg?: string };
      const repoA = new Repo({ storage: new IndexedDBStorageAdapter() });

      // Create initial doc:
      const a = repoA.create<T>({ msg: 'initial' });
      await a.whenReady();
      expect(a.doc()).to.eql({ msg: 'initial' });

      // Change:
      const msg = `hello-👋`;
      a.change((d) => (d.msg = msg));

      // Query the repo for the documents address.
      const b = await repoA.find<T>(a.url);
      expect(b.doc()).to.eql({ msg });

      // Create a secondary repo pointing at the same dir (prove filesystem save)
      await Testing.wait(100); // NB: hack ← typically don't do this on the same process, write are not real-time updated.
      const repoB = new Repo({ storage: new IndexedDBStorageAdapter() });
      const c = await repoB.find<T>(a.url);
      expect(c.doc()).to.eql({ msg });

      // Finish up.
      await repoA.shutdown();
      await repoB.shutdown();
    });
  });
});
