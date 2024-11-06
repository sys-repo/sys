import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { c, describe, expect, Fs, it, slug, Time } from '../-test.ts';

type D = { count: number };

describe(
  'Automerge: Filesystem (Posix)',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeResources: false, sanitizeOps: false },

  () => {
    const TEST_DIR = Fs.resolve('./.tmp/automerge-fs-tests');
    it('BEFORE', async () => {
      await Fs.remove(TEST_DIR);
    });

    it('saves to file-system', async () => {
      const dir = Fs.join(TEST_DIR, slug());
      console.info(`Storage base directory:\n${c.gray(dir)}`);
      expect(await Fs.exists(dir)).to.be.false; // NB: before, nothing exists on file-system.

      const storage = new NodeFSStorageAdapter(dir);
      const repo1 = new Repo({ storage });

      expect(await Fs.exists(dir)).to.be.false; // NB: Repos exists, but not flushed to file-system yet.
      await Time.wait(0);
      expect(await Fs.exists(dir)).to.be.true; // NB: Storage adapter laid down target folder.

      // Make a change to the CRDT.
      const a = repo1.create<D>({ count: 0 });
      expect(a.docSync()).to.eql({ count: 0 });

      a.change((d) => (d.count = 123));
      expect(a.docSync()?.count).to.eql(123);

      // Load from URL (force retrieval from the file-system).
      const b = repo1.find<D>(a.url);
      await b.whenReady();
      expect(b.docSync()?.count).to.eql(123);
    });
  },
);
