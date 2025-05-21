import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { Testing, describe, expect, it, slug } from '../-test.ts';

describe('CRDT: file-system', { sanitizeResources: false, sanitizeOps: false }, () => {
  describe('raw: underlying automerge/repo library', () => {
    /**
     * Ref:
     * https://automerge.org/docs/repositories/
     */
    it('repo: sample fs persistence', async () => {
      type T = { msg?: string };
      const fs = await Testing.dir('crdt.fs').create();
      const repoA = new Repo({ storage: new NodeFSStorageAdapter(fs.dir) });

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
      const repoB = new Repo({ storage: new NodeFSStorageAdapter(fs.dir) });
      const c = await repoB.find<T>(a.url);
      expect(c.doc()).to.eql({ msg });

      // Finish up.
      await repoA.shutdown();
      await repoB.shutdown();
    });
  });
});
