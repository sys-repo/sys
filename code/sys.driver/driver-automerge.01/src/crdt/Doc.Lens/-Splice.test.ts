import { describe, expect, it, type t } from '../../-test.ts';
import { Doc } from '../Doc/mod.ts';
import { Store } from '../Store/mod.ts';

describe(
  'Doc.Lens: splice',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeResources: false, sanitizeOps: false },

  () => {
    type TRoot = { child: TChild };
    type TChild = { text: string };

    const store = Store.init();
    const setup = (options: { store?: t.Store } = {}) => {
      return (options.store ?? store).doc.getOrCreate<TRoot>((d) => (d.child = { text: '' }));
    };

    describe('change from patches', () => {
      it('add text', async () => {
        const doc1 = await setup();
        const doc2 = await setup();

        /**
         * Prepare the CRDT lenses.
         */
        const lens1 = Doc.Lens.create<TRoot, TChild>(doc1, ['child']);
        const lens2 = Doc.Lens.create<TRoot, TChild>(doc2, ['child']);
        const events1 = lens1.events();

        /**
         * Cature changes.
         */
        const fired: t.LensChanged<TChild>[] = [];
        events1.changed$.subscribe((e) => fired.push(e));

        /**
         * Lens-1: Make a change (using the CRDT splicer)
         */
        lens1.change((d) => Doc.Text.splice(d, ['text'], 0, 0, 'hello'));
        expect(lens1.current).to.eql({ text: 'hello' });
        expect(lens2.current).to.eql({ text: '' });

        /**
         * Lens-2: Manually write the change in on the other lens using change [Patches].
         */
        lens2.change((d) => {
          fired[0].patches
            .filter((patch) => patch.action === 'splice')
            .map((patch) => patch as t.A.SpliceTextPatch)
            .forEach((patch) => {
              const index = patch.path[patch.path.length - 1] as number;
              const path = patch.path.slice(0, -1);
              Doc.Text.splice(d, path, index, 0, patch.value);
            });
        });

        expect(lens1.current).to.eql({ text: 'hello' });
        expect(lens2.current).to.eql({ text: 'hello' });
      });
    });

    it('done (clean up)', () => store.dispose());
  },
);
