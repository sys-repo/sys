import { describe, expect, it } from '../../-test.ts';
import { Doc } from '../Doc/mod.ts';
import { Store } from '../Store/mod.ts';
import { Registry } from './Lens.Registry.ts';
import { Lens } from './mod.ts';

describe(
  'Doc.Lens',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeResources: false, sanitizeOps: false },

  () => {
    type TRoot = { msg?: string; child?: TChild };
    type TChild = { count: number; child?: TChild };

    const path = ['child'];
    const store = Store.init();
    const setup = () => store.doc.getOrCreate<TRoot>((d) => (d.child = { count: 0 }));

    it('API references', () => {
      expect(Lens.Registry).to.equal(Registry);
      expect(Doc.Lens.Registry).to.equal(Registry);
    });

    it('does not exist (get, total)', async () => {
      const root = await setup();
      expect(Registry.get(root)).to.eql(undefined);
      expect(Registry.total(root)).to.eql(0);
    });

    it('add', async () => {
      const root = await setup();
      const res1 = Registry.add(root);
      const res2 = Registry.add(root);
      expect(res1.total).to.eql(1);
      expect(res2.total).to.eql(2);
      expect(Registry.get(root)?.total).to.eql(2);
      expect(Registry.total(root)).to.eql(2);
    });

    it('remove', async () => {
      const root1 = await setup();
      const root2 = await setup();

      Registry.add(root1);
      Registry.add(root1);
      expect(Registry.total(root1)).to.eql(2);

      Registry.remove(root1);
      expect(Registry.total(root1)).to.eql(1);

      Registry.remove(root2);
      expect(Registry.total(root1)).to.eql(1);

      Registry.remove(root1);
      Registry.remove(root1);
      Registry.remove(root1);
      expect(Registry.total(root1)).to.eql(0);
      expect(Registry.get(root1)).to.eql(undefined);
    });

    it('lens → add → dispose → remove', async () => {
      const root1 = await setup();
      const root2 = await setup();

      expect(Registry.total(root1)).to.eql(0);

      const lens1 = Lens.create<TRoot, TChild>(root1, path);
      const lens2 = Lens.create<TRoot, TChild>(root1, path);
      const lens3 = lens2.lens(path, (d) => (d.child = { count: 0 }));
      const lens4 = Lens.create<TRoot, TChild>(root2, path); // NB: not the same root doc.

      expect(Registry.total(root1)).to.eql(3);

      lens1.dispose();
      expect(Registry.total(root1)).to.eql(2);

      lens2.dispose();
      expect(Registry.total(root1)).to.eql(0); // NB: lens3 is disposed because it is a sub-lens of lens2.

      expect(lens1.disposed).to.eql(true);
      expect(lens2.disposed).to.eql(true);
      expect(lens3.disposed).to.eql(true);
      expect(lens4.disposed).to.eql(false);
    });

    it('done (clean up)', () => {
      store.dispose();
    });
  },
);
