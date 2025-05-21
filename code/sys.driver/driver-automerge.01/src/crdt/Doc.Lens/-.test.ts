import { describe, expect, it, rx, type t } from '../../-test.ts';
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
    type TChild = { count: number; child?: TChild; list?: TChild[] };

    const path = ['child'];
    const store = Store.init();
    const setup = (options: { store?: t.Store } = {}) => {
      return (options.store ?? store).doc.getOrCreate<TRoot>((d) => (d.child = { count: 0 }));
    };

    describe('create', () => {
      it('Doc.Lens.init', async () => {
        const root = await setup();
        expect(root.current).to.eql({ child: { count: 0 } });

        const lens = Doc.Lens.create<TRoot, TChild>(root, path);
        expect(lens.current).to.eql({ count: 0 });

        const instance = lens.instance;
        expect(instance.startsWith(`crdt:${root.uri}`)).to.eql(true);
        expect(instance.substring(0, instance.lastIndexOf('.')).endsWith(':lens')).to.eql(true);
      });

      it('Doc.lens ← exposed as library entry', async () => {
        const root = await setup();
        const lens = Doc.lens<TRoot, TChild>(root, path);
        expect(lens.current).to.eql({ count: 0 });
      });

      it('Doc.lens ← created from root AND/OR lens', async () => {
        const root = await setup();
        const lens1 = Doc.lens<TRoot, TChild>(root, path);
        const lens2 = Doc.lens<TChild, TChild>(lens1, path, (d) => (d.child = { count: -1 }));
        expect(root.current).to.eql({ child: { count: 0, child: { count: -1 } } });

        lens2.change((d) => (d.count = 123));
        expect(lens2.current).to.eql({ count: 123 });
        expect(lens1.current).to.eql({ count: 0, child: { count: 123 } });
        expect(root.current).to.eql({ child: { count: 0, child: { count: 123 } } });
      });

      it('options: {init} param', async () => {
        const root = await store.doc.getOrCreate<TRoot>(() => null);
        const lens = Lens.create<TRoot, TChild>(root, path, {
          init: (d) => (d.child = { count: 1 }),
        });
        expect(lens.current).to.eql({ count: 1 });
      });

      it('options: init as function()', async () => {
        const root = await store.doc.getOrCreate<TRoot>(() => null);
        const lens = Lens.create<TRoot, TChild>(root, path, (d) => (d.child = { count: 123 }));
        expect(lens.current).to.eql({ count: 123 });
      });

      it('does not run init function() when target already present', async () => {
        const root1 = await store.doc.getOrCreate<TRoot>((d) => (d.child = { count: 0 }));
        const root2 = await store.doc.getOrCreate<TRoot>(() => null);
        const lens1 = Lens.create<TRoot, TChild>(root1, path, (d) => (d.child = { count: 123 }));
        const lens2 = Lens.create<TRoot, TChild>(root2, path, (d) => (d.child = { count: 123 }));
        expect(lens1.current).to.eql({ count: 0 });
        expect(lens2.current).to.eql({ count: 123 });
      });

      it('ensures simple {object} at path when init not specified (default)', async () => {
        const root = await store.doc.getOrCreate<TRoot>(() => null);
        expect(root.current).to.eql({});
        const lens = Lens.create<TRoot, TChild>(root, path);
        expect(root.current).to.eql({ child: {} });
        expect(lens.current).to.eql({});
      });

      it('lens.toObject', async () => {
        const root = await setup();
        const lens = Lens.create<TRoot, TChild>(root, path);
        expect(lens.current).to.equal(lens.current);
        expect(lens.toObject()).to.eql(lens.current);
        expect(lens.toObject()).to.not.equal(lens.current);
      });

      it('throw: path does not yield an {object}', async () => {
        const root = await store.doc.getOrCreate<TRoot>(() => null);
        const fn = () => Lens.create<TRoot, TChild>(root, path, () => 'not-an-object');
        expect(fn).to.throw(/Target path of \[Lens\] is not an object/);
      });
    });

    describe('dispose', () => {
      it('disposes when store disposes', async () => {
        const store = Store.init();
        const root = await setup({ store });

        const lens = Lens.create<TRoot, TChild>(root, path);
        expect(Registry.exists(root)).to.eql(true);

        expect(lens.disposed).to.eql(false);
        expect(store.disposed).to.eql(false);

        store.dispose();
        expect(Registry.exists(root)).to.eql(false);

        expect(lens.disposed).to.eql(true);
        expect(store.disposed).to.eql(true);
      });

      it('disposes when deleted from store', async () => {
        const root = await setup();
        const timeout = 10;
        const lens = Lens.create<TRoot, TChild>(root, path);

        expect(lens.disposed).to.eql(false);
        expect(await store.doc.exists(root.uri, { timeout })).to.eql(true);

        await store.doc.delete(root.uri);
        expect(lens.disposed).to.eql(true);
        expect(await store.doc.exists(root.uri, { timeout })).to.eql(false);
      });

      it('disposes lens without effecting root', async () => {
        const root = await setup();
        const timeout = 10;
        const lens = Lens.create<TRoot, TChild>(root, path);

        expect(lens.disposed).to.eql(false);
        expect(store.disposed).to.eql(false);
        expect(await store.doc.exists(root.uri, { timeout })).to.eql(true);

        lens.dispose();
        expect(lens.disposed).to.eql(true);
        expect(store.disposed).to.eql(false);
        expect(await store.doc.exists(root.uri, { timeout })).to.eql(true); // NB: no change.
      });
    });

    describe('path', () => {
      it('path undefined', async () => {
        const root = await setup();
        const lens = Lens.create<TRoot, TChild>(root);
        expect(lens.current).to.eql(root.current);
      });

      it('path as array', async () => {
        const root = await setup();
        const lens = Lens.create<TRoot, TChild>(root, path);
        expect(lens.current).to.eql({ count: 0 });
      });

      it('path as function → {object}', async () => {
        const root = await setup();
        const lens = Lens.create<TRoot, TChild>(root, () => path);
        expect(lens.current).to.eql({ count: 0 });
      });

      it('path as function → [index] → {object}', async () => {
        const root = await setup();
        let index = 0;
        const lens = Lens.create<TRoot, TChild>(
          root,
          () => ['child', 'list', index],
          (d) => (d.child!.list = [{ count: 0 }, { count: 1 }]),
        );
        expect(lens.current).to.eql({ count: 0 });
        index = 1;
        expect(lens.current).to.eql({ count: 1 });
      });

      it('throw: path does not yield {object}', async () => {
        const root = await setup();
        const path = ['child', 'count']; // NB: number
        const fn = () => Lens.create<TRoot, TChild>(root, path);
        expect(fn).to.throw(/Target path of \[Lens\] is not an object/);
      });

      it('throw: path index does not yield {object}', async () => {
        const root = await setup();
        const fn = () =>
          Lens.create<TRoot, TChild>(
            root,
            () => ['child', 'list', 2],
            (d) => (d.child!.list = []),
          );
        expect(fn).to.throw(/Target path of \[Lens\] is not an object/);
      });

      it('path → root', async () => {
        const root = await setup();
        const lens1 = Lens.create<TRoot, TChild>(root, []);
        const lens2 = Lens.create<TRoot, TChild>(root, () => []);
        expect(lens1.current).to.eql(root.current);
        expect(lens2.current).to.eql(root.current);
      });
    });

    describe('change', () => {
      it('lens descendent object does initially exist', async () => {
        const root = await setup();
        const lens = Lens.create<TRoot, TChild>(root, path);

        lens.change((child) => (child.count = 123));
        expect(lens.current.count).to.eql(123);
        expect(root.current.child?.count).to.eql(123);

        lens.change((child) => (child.count = 456));
        expect(lens.current.count).to.eql(456);
        expect(root.current.child?.count).to.eql(456);
      });

      it('lens descendent object does not initially exist (factory generated)', async (_e) => {
        const root = await setup();
        const lens = Lens.create<TRoot, TChild>(root, path);

        lens.change((child) => (child.count = 123));

        expect(lens.current.count).to.eql(123);
        expect(root.current.child?.count).to.eql(123);
      });

      it('patches callback', async () => {
        const root = await setup();
        const lens = Lens.create<TRoot, TChild>(root, path);
        const patches: t.Patch[] = [];

        lens.change((child) => (child.count = 123), { patches: (e) => patches.push(...e) });
        lens.change(
          (child) => (child.count = 456),
          (e) => patches.push(...e),
        );

        expect(patches.length).to.eql(2);
        expect(patches[0]).to.eql({ action: 'put', path: ['count'], value: 123 });
        expect(patches[1]).to.eql({ action: 'put', path: ['count'], value: 456 });
      });

      it('no change when deleted', async () => {
        const root = await setup();
        const lens = Lens.create<TRoot, TChild>(root, path);

        lens.change((d) => (d.count = 123));
        expect(lens.current.count).to.eql(123);

        await store.doc.delete(root.uri);
        expect(root.is.deleted).to.eql(true);
        expect(lens.disposed).to.eql(true);

        lens.change((d) => (d.count = 456));
        expect(lens.current).to.eql(undefined);
      });
    });

    describe('events ($)', () => {
      it('change events → descendent', async () => {
        const root = await setup();
        const lens = Lens.create<TRoot, TChild>(root, path);
        const events = lens.events();

        const patches: t.Patch[] = [];
        const fired: t.LensChanged<TChild>[] = [];
        events.changed$.subscribe((e) => fired.push(e));

        lens.change(
          (d) => (d.count = 123),
          (e) => patches.push(...e),
        );
        expect(fired.length).to.eql(1);
        expect(fired[0].after.count).to.eql(123);
        expect(fired[0].patches[0].action).to.eql('put');
        expect(fired[0].patches[0].path).to.eql(['count']);
        expect(patches).to.eql(fired[0].patches); // Callback patches match fired event.

        events.dispose();
      });

      it('change on root ← fires through lens', async () => {
        const root = await setup();
        const lens = Lens.create<TRoot, TChild>(root, path);
        const events = lens.events();

        const fired: t.LensChanged<TChild>[] = [];
        events.changed$.subscribe((e) => fired.push(e));

        root.change((d) => (d.msg = 'hello root'));
        expect(fired.length).to.eql(0); // NB: no change within the lens child - event not fired.

        root.change((d) => {
          d.child || (d.child = { count: 0 });
          d.child.count = 1234;
        });

        expect(fired.length).to.eql(1);
        expect(fired[0].before.count).to.eql(0);
        expect(fired[0].after.count).to.eql(1234);
        expect(fired[0].patches[0].path).to.eql(['count']);

        expect(root.current.child?.count).to.eql(1234);

        lens.change((d) => (d.count = 888));
        expect(fired.length).to.eql(2);
        expect(fired[1].patches[0].path).to.eql(['count']);

        events.dispose();
      });

      it('change on same descendent → different lens', async () => {
        const root = await setup();
        const lens1 = Lens.create<TRoot, TChild>(root, path);
        const lens2 = Lens.create<TRoot, TChild>(root, path);
        const events1 = lens1.events();
        const events2 = lens2.events();

        const fired1: t.LensChanged<TChild>[] = [];
        const fired2: t.LensChanged<TChild>[] = [];
        events1.changed$.subscribe((e) => fired1.push(e));
        events2.changed$.subscribe((e) => fired2.push(e));

        expect(lens1.current.count).to.eql(0);
        expect(lens2.current.count).to.eql(0);

        lens1.change((d) => d.count++);

        expect(fired1.length).to.eql(1);
        expect(fired2.length).to.eql(1);
        expect(fired2[0]).to.eql(fired1[0]);

        expect(lens1.current.count).to.eql(1);
        expect(lens2.current.count).to.eql(1);

        events1.dispose();
        events2.dispose();
      });

      it('no-change: lens on different sub-trees', async () => {
        type T = {
          A: { count: number };
          B: { child: { count: number } };
        };

        const root = await store.doc.getOrCreate<T>((d) => {
          d.A = { count: 0 };
          d.B = { child: { count: 0 } };
        });

        const lens1 = Lens.create<T, T['A']>(root, ['A']);
        const lens2 = Lens.create<T, T['B']>(root, ['B']);
        const events1 = lens1.events();
        const events2 = lens2.events();

        const fired1: t.LensChanged<T['A']>[] = [];
        const fired2: t.LensChanged<T['B']>[] = [];
        events1.changed$.subscribe((e) => fired1.push(e));
        events2.changed$.subscribe((e) => fired2.push(e));

        lens1.change((d) => d.count++);
        expect(lens1.current.count).to.eql(1);
        expect(fired1.length).to.eql(1);
        expect(fired2.length).to.eql(0); // No change on lens2 sub-tree.

        lens2.change((d) => (d.child.count = 1234));
        expect(lens2.current.child.count).to.eql(1234);
        expect(fired1.length).to.eql(1); // No change (new) on lens1 sub-tree.
        expect(fired2.length).to.eql(1);

        events1.dispose();
        events2.dispose();
      });

      it('lens nested within lens (same root) ← events', async () => {
        const root = await setup();

        const lens1 = Lens.create<TRoot, TChild>(root, ['child'], (doc) => {
          const d1 = doc.child || (doc.child = { count: 0 });
          return d1;
        });
        const lens2 = Lens.create<TRoot, TChild>(root, ['child', 'child'], (doc) => {
          const d1 = doc.child || (doc.child = { count: 0 });
          const d2 = d1.child || (d1.child = { count: 0 });
          return d2;
        });

        const events1 = lens1.events();
        const events2 = lens2.events();

        type C = t.LensChanged<TChild>;
        const fired1: C[] = [];
        const fired2: C[] = [];
        events1.changed$.subscribe((e) => fired1.push(e));
        events2.changed$.subscribe((e) => fired2.push(e));

        lens2.change((d) => (d.count = 1234));
        expect(lens1.current.count).to.eql(0);
        expect(lens1.current.child?.count).to.eql(1234);
        expect(lens2.current.count).to.eql(1234);

        expect(fired1.length).to.eql(1);
        expect(fired2.length).to.eql(1);

        events1.dispose();
        events2.dispose();
      });

      it('deleted', async () => {
        const store = Store.init();
        const root1 = await setup({ store });
        const root2 = await setup({ store });
        const lens = Lens.create<TRoot, TChild>(root1, path);
        const events = lens.events();

        expect(lens.disposed).to.eql(false);
        expect(events.disposed).to.eql(false);

        const fired: t.LensDeleted<TChild>[] = [];
        events.deleted$.subscribe((e) => fired.push(e));

        await store.doc.delete(root2.uri);
        expect(fired.length).to.eql(0); // NB: "root2" not implicated in the lens under test.

        await store.doc.delete(root1.uri);
        expect(fired.length).to.eql(1);
        expect(fired[0].before.count).to.eql(0);
        expect(fired[0].after).to.eql(undefined);

        // NB: deletion of the document auto-disposes of the lens and the events.
        expect(lens.disposed).to.eql(true);
        expect(events.disposed).to.eql(true);

        store.dispose();
      });

      describe('dispose', () => {
        it('on events.dispose() method', async () => {
          const root = await setup();
          const lens = Lens.create<TRoot, TChild>(root, path);
          const events = lens.events();

          expect(events.disposed).to.eql(false);
          events.dispose();
          expect(events.disposed).to.eql(true);
        });

        it('on events({ dispose$ }) param', async () => {
          const root = await setup();
          const lens = Lens.create<TRoot, TChild>(root, path);

          const life = rx.lifecycle();
          const { dispose$ } = life;
          const events = lens.events(dispose$);

          expect(events.disposed).to.eql(false);
          life.dispose();
          expect(events.disposed).to.eql(true);
        });

        it('on parent lens dispose', async () => {
          const root = await setup();
          const lens = Lens.create<TRoot, TChild>(root, path);
          const events = lens.events();

          expect(events.disposed).to.eql(false);
          lens.dispose();
          expect(events.disposed).to.eql(true);
        });

        it('on root store dispose', async () => {
          const store = Store.init();
          const root = await setup({ store });
          const lens = Lens.create<TRoot, TChild>(root, path);
          const events = lens.events();

          expect(events.disposed).to.eql(false);
          store.dispose();
          expect(events.disposed).to.eql(true);
        });
      });
    });

    describe('sub-lens ← lens.lens(...)', () => {
      it('init', async (_e) => {
        const root = await setup();

        const lens1 = Lens.create<TRoot, TChild>(root, path);
        expect(root.current).to.eql({ child: { count: 0 } });
        expect(lens1.current).to.eql({ count: 0 });

        const lens2 = lens1.lens(path, (d) => (d.child = { count: 123 }));
        expect(root.current).to.eql({ child: { count: 0, child: { count: 123 } } });
        expect(lens2.current).to.eql({ count: 123 });
      });

      it('change', async () => {
        const root = await setup();

        const lens1 = Lens.create<TRoot, TChild>(root, path);
        const lens2 = lens1.lens<TChild>(path, (d) => (d.child = { count: 0 }));

        const lens3 = lens2.lens<TChild>(path, (d) => (d.child = { count: 0 }));
        const lens4 = lens3.lens<TChild>(path, (d) => (d.child = { count: -1 }));

        expect(lens1.current).to.eql({
          count: 0,
          child: { count: 0, child: { count: 0, child: { count: -1 } } },
        });
        expect(lens4.current).to.eql({ count: -1 });

        lens4.change((d) => (d.count = 4));
        expect(lens4.current.count).to.eql(4);
        expect(lens1.current).to.eql({
          count: 0,
          child: { count: 0, child: { count: 0, child: { count: 4 } } },
        });
      });

      it('dispose', async () => {
        const store = Store.init();
        const root = await setup({ store });
        const events = root.events();

        const lens1 = Lens.create<TRoot, TChild>(root, path);
        const lens2 = Lens.create<TRoot, TChild>(root, path);
        const lens3 = lens2.lens(path, (d) => (d.child = { count: 0 }));

        lens2.dispose();
        expect(store.disposed).to.eql(false);
        expect(events.disposed).to.eql(false);
        expect(lens1.disposed).to.eql(false);
        expect(lens2.disposed).to.eql(true);
        expect(lens3.disposed).to.eql(true); // NB: sub-lens of lens2 is auto disposed.

        store.dispose();
        expect(store.disposed).to.eql(true);
        expect(events.disposed).to.eql(true);
        expect(lens1.disposed).to.eql(true);
        expect(lens2.disposed).to.eql(true);
        expect(lens3.disposed).to.eql(true);
      });
    });

    it('done (clean up)', () => store.dispose());
  },
);
