import { Doc, Store } from '../mod.ts';
import { A, Is, describe, expect, it, rx, type t } from '../../-test.ts';

type D = { count?: t.A.Counter };

describe(
  'Store (base)',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeResources: false, sanitizeOps: false },

  () => {
    const testSetup = () => {
      const store = Store.init();
      const initial: t.ImmutableMutator<D> = (d) => (d.count = new A.Counter(0));
      const generator = store.doc.factory<D>(initial);
      return { store, initial, generator } as const;
    };

    const { store } = testSetup();

    it('Is.store', () => {
      const non = [true, 123, '', [], {}, null, undefined];
      non.forEach((value) => expect(Is.store(value)).to.eql(false));
      expect(Is.store(store)).to.eql(true);
      expect(Is.repo(store.repo)).to.eql(true);
    });

    it('WebStore.Doc', () => {
      expect(Store.Doc).to.equal(Doc);
    });

    describe('lifecycle', () => {
      it('dispose', () => {
        const store = Store.init();
        expect(store.disposed).to.eql(false);

        let count = 0;
        store.dispose$.subscribe(() => count++);
        store.dispose();
        store.dispose();
        expect(store.disposed).to.eql(true);
        expect(count).to.eql(1);
      });

      it('dispose$', () => {
        const { dispose, dispose$ } = rx.disposable();
        const store = Store.init({ dispose$ });
        expect(store.disposed).to.eql(false);

        let count = 0;
        store.dispose$.subscribe(() => count++);

        dispose();
        expect(store.disposed).to.eql(true);
        expect(count).to.eql(1);
      });
    });

    describe('Store.handle', () => {
      it('invalid input', () => {
        const fails = [null, undefined, 123, [], {}, false];
        fails.forEach((value: any) => {
          const fn = () => Store.handle(value);
          expect(fn).to.throw(/input does not have a handle/);
        });
      });

      it('retrieve handle', async () => {
        const { store, generator } = testSetup();

        const docRef = await generator();
        const docRefHandle = docRef as t.DocWithHandle<D>;
        const handle1 = Store.handle(docRef);
        const handle2 = Store.handle(docRefHandle);

        expect(Is.handle(handle1)).to.eql(true);
        expect(Is.handle(handle2)).to.eql(true);
        expect(handle1).to.equal(handle2);

        store.dispose();
      });
    });
  },
);
