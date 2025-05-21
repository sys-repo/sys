import { Store } from './mod.ts';
import { A, describe, expect, it, type t } from '../../-test.ts';

type D = { count?: t.A.Counter };

describe(
  'Store.repo',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeResources: false, sanitizeOps: false },

  () => {
    const store = Store.init();
    const initial: t.ImmutableMutator<D> = (d) => (d.count = new A.Counter(0));
    const generator = store.doc.factory<D>(initial);

    it('repo.handles', async () => {
      const repo = store.repo;
      expect(repo.handles).to.eql({});
      const doc = await generator();
      const keys = Object.keys(repo.handles);
      expect(keys).to.eql([Store.Doc.Uri.id(doc.uri)]);
    });

    describe('repo.on("delete-document")', () => {
      it('fires on [repo.delete]', async () => {
        let fired = 0;
        const handleDelete = () => fired++;
        store.repo.on('delete-document', handleDelete);

        const doc = await generator();
        store.repo.delete(doc.uri as t.AutomergeUrl);
        expect(fired).to.eql(1);

        store.repo.off('delete-document', handleDelete);
      });

      it('does not fire on [doc.handle.delete]', async () => {
        let fired = 0;
        const handleDelete = () => fired++;
        store.repo.on('delete-document', handleDelete);

        const doc = await generator();
        (doc as t.DocWithHandle<D>).handle.delete(); // NB: This will  not fire the document event.

        expect(fired).to.eql(0);
        store.repo.off('delete-document', handleDelete);
      });
    });
  },
);
