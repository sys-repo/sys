import { Doc } from './mod.ts';
import { describe, expect, it, type t } from '../../-test.ts';
import { testSetup, type D } from './-TEST.u.ts';

describe(
  'Doc.Patch',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeResources: false, sanitizeOps: false },

  () => {
    const { store, factory } = testSetup();

    describe('Patch.apply', () => {
      it('single patch', async () => {
        const doc1 = await factory();
        const doc2 = await factory();
        const events = doc1.events();
        let patches: t.Patch[] = [];
        events.changed$.subscribe((e) => (patches = e.patches));

        doc1.change((d) => d.count++);
        expect(patches.length).to.eql(1);
        expect(doc1.current).to.eql({ count: 1 });
        expect(doc2.current).to.eql({ count: 0 });

        doc2.change((d) => Doc.Patch.apply(d, patches[0]));
        expect(doc1.current).to.eql({ count: 1 });
        expect(doc2.current).to.eql({ count: 1 });

        events.dispose();
      });

      it('multiple patches', async () => {
        const doc1 = await factory();
        const doc2 = await factory();
        const events = doc1.events();
        let patches: t.Patch[] = [];
        events.changed$.subscribe((e) => (patches = e.patches));

        doc1.change((d) => {
          d.count++;
          d.msg = 'hello';
        });
        expect(patches.length).to.eql(3);
        expect(doc1.current).to.eql({ count: 1, msg: 'hello' });
        expect(doc2.current).to.eql({ count: 0 });

        let res: D | undefined;
        doc2.change((d) => (res = Doc.Patch.apply(d, patches)));
        expect(doc1.current).to.eql({ count: 1, msg: 'hello' });
        expect(doc2.current).to.eql({ count: 1, msg: 'hello' });
        expect(res).to.eql({ count: 1, msg: 'hello' });

        events.dispose();
      });

      it('pass: docRef<T>', async () => {
        const doc1 = await factory();
        const doc2 = await factory();
        const events = doc1.events();
        let patches: t.Patch[] = [];
        events.changed$.subscribe((e) => (patches = e.patches));

        doc1.change((d) => {
          d.count++;
          d.msg = 'hello';
        });
        expect(patches.length).to.eql(3);
        expect(doc1.current).to.eql({ count: 1, msg: 'hello' });
        expect(doc2.current).to.eql({ count: 0 });

        const res = Doc.Patch.apply(doc2, patches);
        expect(doc1.current).to.eql({ count: 1, msg: 'hello' });
        expect(doc2.current).to.eql({ count: 1, msg: 'hello' });
        expect(res).to.eql({ count: 1, msg: 'hello' });

        events.dispose();
      });
    });

    it('|test.dispose|', () => store.dispose());
  },
);
