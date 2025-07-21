import { AutomergeRepo, c, describe, expect, expectError, it } from '../mod.ts';

describe(
  'automerge-repo: raw underlying API assertions',
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    it('delete handle', async () => {
      const repo = new AutomergeRepo();
      const handleA = repo.create({});
      const id = handleA.documentId;

      await handleA.whenReady();
      expect(handleA.isDeleted()).to.eql(false);

      const handleB = await repo.find(id);
      expect(handleB.isDeleted()).to.eql(false);

      repo.delete(id);
      expect(handleA.isDeleted()).to.eql(true);

      // Document is no longer in repo:
      await expectError(() => repo.find(id), `Document ${id} is unavailable`);
      await repo.shutdown();
    });

    describe('history', () => {
      type T = { count: number; msg?: string };

      it('handle.history: UrlHeads', async () => {
        const repo = new AutomergeRepo();
        const handle = repo.create<T>({ count: 0 });
        await handle.whenReady();

        const a = handle.history();
        handle.change((d) => d.count++);
        const b = handle.history();

        expect(a?.length).to.eql(1);
        expect(b?.length).to.eql(2);

        await repo.shutdown();
      });

      it('handle.view: frozen read-only view at point-in-time and "rollback"', async () => {
        const repo = new AutomergeRepo();
        const handle = repo.create<T>({ count: 0, msg: '👋' });
        await handle.whenReady();

        handle.change((d) => (d.count = 100)); // ← 100
        handle.change((d) => (d.count += 50)); // ← 150
        handle.change((d) => (d.count -= 10)); // ← 140
        handle.change((d) => d.count++); //       ← 141
        expect(handle.doc().count).to.eql(141);

        // Read out history (HEADS):
        const history = handle.history()!;
        expect(history.length).to.eql(5);
        console.info(c.cyan(c.bold(`History (HEADS):`)));
        console.info(history);

        // Peek at historical values via a read-only "view":
        const genesis = handle.view(history.at(0)!);
        const prev = handle.view(history.at(-2)!);
        expect(prev.doc().count).to.eql(140);
        expect(genesis.doc().count).to.eql(0);

        // Generate a diff (patch list):
        const patch = prev.diff(handle);
        expect(patch).to.eql([{ action: 'put', path: ['count'], value: 141 }]);

        // Re-apply a "rollback" as a brand-new change:
        expect(handle.doc().count).to.eql(141);
        handle.changeAt(history.at(-3)!, (doc) => doc.count++);

        expect(handle.history()!.length).to.eql(history.length + 1);
        expect(handle.doc().count).to.eql(151);
        expect(handle.doc().msg).to.eql('👋'); // NB: no change.
      });
    });
  },
);
