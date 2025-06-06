import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { type t, Testing, describe, expect, it } from '../-test.ts';

describe('CRDT: file-system', { sanitizeResources: false, sanitizeOps: false }, () => {
  /**
   * Ref:
   * https://automerge.org/docs/repositories/
   */
  it('repo → persistence: file-system', async () => {
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
    expect(docB.doc()).to.eql({ msg });

    // Create a secondary repo pointing at the same dir (prove filesystem save)
    await Testing.wait(100); // NB: hack ← typically don't do this on the same process, write are not real-time updated.
    const repoB = new Repo({ storage: new NodeFSStorageAdapter(fs.dir) });
    const docC = await repoB.find<T>(docA.url);
    expect(docC.doc()).to.eql({ msg });

    // Finish up.
    await repoA.shutdown();
    await repoB.shutdown();
  });
});
