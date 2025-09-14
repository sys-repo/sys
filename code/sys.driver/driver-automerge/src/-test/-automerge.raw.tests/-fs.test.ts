import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { Testing, describe, expect, it } from '../mod.ts';

describe('CRDT: file-system', { sanitizeResources: false, sanitizeOps: false }, () => {
  /**
   * Ref:
   * https://automerge.org/docs/repositories/
   */
  it('repo → persistence', async () => {
    type T = { msg?: string };
    const fs = await Testing.dir('crdt.fs').create();
    const repoA = new Repo({ storage: new NodeFSStorageAdapter(fs.dir) });

    // Create initial doc:
    const docA = repoA.create<T>({ msg: 'initial' });
    await docA.whenReady();
    expect(docA.doc()).to.eql({ msg: 'initial' });

    // Change:
    const msg = `hello-👋`;
    docA.change((d) => (d.msg = msg));

    // Query the repo for the documents address.
    const docB = await repoA.find<T>(docA.url);
    await docB.whenReady();
    expect(docB.doc()).to.eql({ msg });

    await repoA.shutdown(); // ← flush deterministically before reading from a new Repo.

    // Create a secondary repo pointing at the same dir (prove filesystem save).
    const repoB = new Repo({ storage: new NodeFSStorageAdapter(fs.dir) });

    const docC = await repoB.find<T>(docA.url);
    await docC.whenReady();
    expect(docC.doc()).to.eql({ msg });

    // Finish up.
    await repoB.shutdown();
  });
});
