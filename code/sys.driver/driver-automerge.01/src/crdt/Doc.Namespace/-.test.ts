import { A, describe, expect, it, rx, type t } from '../../-test.ts';
import { Doc } from '../Doc/mod.ts';
import { Store } from '../Store/mod.ts';
import { Namespace } from './mod.ts';

describe(
  'Namespace (Lens)',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeResources: false, sanitizeOps: false },

  () => {
    type TRoot = { ns?: t.NamespaceMap; foo?: TFoo; list?: t.NamespaceMap[] };
    type TFoo = { ns?: t.NamespaceMap };
    type TDoc = { count: number };
    type TError = { message?: string };

    const store = Store.init();
    const setup = (options: { store?: t.Store } = {}) => {
      return (options.store ?? store).doc.getOrCreate<TRoot>(() => null);
    };

    it('init', async () => {
      const doc = await setup();
      const ns1 = Namespace.create<TRoot>(doc);
      const ns2 = Doc.ns<TRoot>(doc);
      expect(Doc.Is.namespace(ns1)).to.eql(true);
      expect(Doc.Is.namespace(ns2)).to.eql(true);
    });

    it('toType<T>() conversion', async () => {
      const doc = await setup();
      type N = 'foo' | 'bar';
      const ns1 = Namespace.create<TRoot>(doc);
      const ns2 = ns1.typed<N>();
      ns1.lens('baz', {});
      ns2.lens('foo', {});
      expect(ns1).to.equal(ns2);
      expect(doc.current).to.eql({ baz: {}, foo: {} });
    });

    describe('container', () => {
      it('namespace.container: { document } root ← no path)', async () => {
        const doc = await setup();
        const namespace = Namespace.create<TRoot>(doc);

        const res1 = namespace.container;
        const res2 = namespace.container;

        expect(res1).to.eql({});
        expect(res2).to.eql({});
        expect(res1).to.not.equal(res2); // NB: different object instances.
        expect(res1).to.eql(doc.current);

        expect(A.isAutomerge(res1)).to.eql(false);

        const lens = namespace.lens<TDoc>('foo', { count: 0 });
        lens.change((d) => d.count++);

        const res3 = namespace.container;
        expect(res1).to.eql({});
        expect(res3).to.eql({ foo: { count: 1 } });
      });

      it('namespace.container: from sub-tree (get container → ƒ)', async () => {
        type N = 'foo' | 'bar';
        const doc = await setup();
        const ns = Namespace.create<TRoot, N>(doc, ['ns'], (d) => (d.ns = {}));
        expect(ns.container).to.eql({});
        expect(ns.container).to.not.equal(ns.container);
        expect(A.isAutomerge(ns.container)).to.eql(false);

        const foo = ns.lens<TDoc>('foo', { count: 0 });
        const bar = ns.lens<TError>('bar', {});
        expect(ns.container.foo).to.eql({ count: 0 });

        foo.change((d) => d.count++);
        expect(ns.container.foo).to.eql({ count: 1 });
        expect(ns.container.bar).to.eql({});

        bar.change((d) => (d.message = '👋'));
        expect(ns.container.foo).to.eql({ count: 1 });
        expect(ns.container.bar).to.eql({ message: '👋' });
      });

      it('namespace.container ← from within array (dynamic index)', async () => {
        type N = 'foo' | 'bar';
        const doc = await setup();
        let index = 0;
        const ns = Namespace.create<TRoot, N>(
          doc,
          () => ['list', index],
          (d) => (d.list = [{}, {}]),
        );
        expect(ns.container).to.eql({});

        ns.lens<TDoc>('foo', { count: 123 });
        index = 1;
        ns.lens<TDoc>('bar', { count: 456 });

        expect(doc.current.list![0]).to.eql({ foo: { count: 123 } });
        expect(doc.current.list![1]).to.eql({ bar: { count: 456 } });
      });
    });

    describe('events ← (container observable)', () => {
      type N = 'foo' | 'bar';

      it('change events', async () => {
        const doc = await setup();
        const ns = Namespace.create<TRoot, N>(doc, ['ns'], (d) => (d.ns = {}));
        const events = ns.events();

        const fired: t.LensChanged<t.NamespaceMap<N>>[] = [];
        events.changed$.subscribe((e) => fired.push(e));

        const foo = ns.lens<TDoc>('foo', { count: 0 });
        expect(fired.length).to.eql(1);
        expect(fired[0].after.foo).to.eql({ count: 0 });
        expect(fired[0].after.bar).to.eql(undefined);

        ns.lens<TDoc>('bar', { count: 123 });
        expect(fired.length).to.eql(2);
        expect(fired[1].after.foo).to.eql({ count: 0 });
        expect(fired[1].after.bar).to.eql({ count: 123 });

        foo.change((d) => d.count++);
        expect(fired.length).to.eql(3);
        expect(fired[2].after.foo).to.eql({ count: 1 });
        expect(fired[2].after.bar).to.eql({ count: 123 });

        events.dispose();
      });

      it('no longer fires after dispose', async () => {
        const doc = await setup();
        const ns = Doc.ns<TRoot, N>(doc, ['ns'], (d) => (d.ns = {}));
        const events = ns.events();

        const fired: t.LensChanged<t.NamespaceMap<N>>[] = [];
        events.changed$.subscribe((e) => fired.push(e));

        const foo = ns.lens<TDoc>('foo', { count: 0 });
        foo.change((d) => d.count++);
        expect(fired.length).to.eql(2);

        ns.dispose();
        foo.change((d) => d.count++);
        foo.change((d) => d.count++);
        expect(fired.length).to.eql(2);

        events.dispose();
      });

      describe('dispose', () => {
        it('disposed on events({ dispose$ }) param', async () => {
          const life = rx.lifecycle();
          const doc = await setup();
          const ns = Doc.ns<TRoot, N>(doc, ['ns'], (d) => (d.ns = {}));
          const events = ns.events(life.dispose$);

          expect(events.disposed).to.eql(false);
          life.dispose();
          expect(events.disposed).to.eql(true);
        });

        it('auto disposed after [namespace] is disposed', async () => {
          const doc = await setup();
          const ns = Doc.ns<TRoot, N>(doc, ['ns'], (d) => (d.ns = {}));
          const events = ns.events();

          expect(events.disposed).to.eql(false);
          ns.dispose();
          expect(events.disposed).to.eql(true);
        });
      });
    });

    describe('lens', () => {
      it('namespace.lens: from { document } root', async () => {
        const doc = await setup();
        const namespace = Doc.ns<TRoot>(doc);

        const ns1 = namespace.lens<TDoc>('foo', { count: 123 });
        const ns2 = namespace.lens('foo', { count: 0 });
        const ns3 = namespace.lens<TDoc>('bar', { count: 456 });

        expect(doc.current.ns).to.eql(undefined);
        expect((doc.current as any).foo).to.eql({ count: 123 }); // NB: initial count from first call.
        expect((doc.current as any).bar).to.eql({ count: 456 });

        ns2.change((d) => (d.count = 888));
        ns3.change((d) => (d.count = 999));

        expect(ns1.current).to.eql({ count: 888 });
        expect(namespace.lens('foo', { count: 0 }).current).to.eql({ count: 888 });
        expect((doc.current as any).foo).to.eql({ count: 888 });
        expect((doc.current as any).bar).to.eql({ count: 999 });
      });

      it('namespace.lens: from sub-tree (get container → ƒ)', async () => {
        const doc = await setup();
        const namespace = Doc.ns<TRoot>(doc, ['ns'], (d) => (d.ns = {}));
        expect(doc.current.ns).to.eql({});

        const ns1 = namespace.lens<TDoc>('foo', { count: 0 });
        const ns2 = namespace.lens<TError>('bar', {});

        type NS = t.NamespaceMap; // NB: generic string as namespace key.
        expect((doc.current.ns as NS).foo).to.eql({ count: 0 });
        expect((doc.current.ns as NS).bar).to.eql({});

        ns1.change((d) => (d.count = 123));
        ns2.change((d) => (d.message = 'hello'));

        expect((doc.current.ns as NS).foo).to.eql({ count: 123 });
        expect((doc.current.ns as NS).bar).to.eql({ message: 'hello' });

        expect(ns1.current).to.eql({ count: 123 });
        expect(ns2.current).to.eql({ message: 'hello' });
      });

      it('strongly typed namespace "names" (string union)', async () => {
        type N = 'foo.bar' | 'foo.baz';
        type NS = t.NamespaceMap<N>;
        const doc = await setup();
        const namespace = Doc.ns<TRoot, N>(doc, ['ns'], (d) => (d.ns = {}));

        const ns1 = namespace.lens<TDoc>('foo.bar', { count: 0 });
        const ns2 = namespace.lens<TError>('foo.baz', {});

        ns1.change((d) => (d.count = 123));
        ns2.change((d) => (d.message = 'hello'));

        expect((doc.current.ns as NS)['foo.bar']).to.eql({ count: 123 });
        expect((doc.current.ns as NS)['foo.baz']).to.eql({ message: 'hello' });
      });

      it('same namespace → single instance of lens', async () => {
        const doc = await setup();
        const namespace = Doc.ns<TRoot>(doc);

        const ns1 = namespace.lens<TDoc>('foo', { count: 123 });
        const ns2 = namespace.lens<TDoc>('foo', { count: 456 });

        expect(ns1).to.equal(ns2); // NB: same instance.
        expect(ns1.current).to.eql(ns2.current);
        expect(ns2.current.count).to.eql(123); // NB: the second call to lens did not construct a new one.
      });
    });

    describe('list', () => {
      it('empty', async () => {
        const doc = await setup();
        const namespace = Doc.ns<TRoot>(doc);
        expect(namespace.list()).to.eql([]);
      });

      it('items', async () => {
        type K = 'foo' | 'bar';
        const doc = await setup();
        const namespace = Doc.ns<TRoot, K>(doc);

        const initial: TDoc = { count: 0 };
        const foo = namespace.lens('foo', initial);
        const bar = namespace.lens('bar', initial);

        const list = namespace.list<TDoc>();
        expect(list.length).to.eql(2);
        expect(list[0].namespace).to.eql('foo');
        expect(list[1].namespace).to.eql('bar');
        expect(list[0].lens).to.eql(foo);
        expect(list[1].lens).to.eql(bar);
      });

      it('new list every call', async () => {
        const doc = await setup();
        const namespace = Doc.ns<TRoot>(doc);
        expect(namespace.list()).to.not.equal(namespace.list()); // NB: new instance each time.
      });
    });

    describe('dispose', () => {
      it('{ dispose$ } ← as param', async () => {
        const doc = await setup();
        const { dispose, dispose$ } = rx.disposable();
        const namespace = Doc.ns<TRoot>(doc, ['ns'], {
          dispose$,
          init: (d) => (d.ns = {}),
        });
        const ns1 = namespace.lens<TDoc>('foo', { count: 0 });
        const ns2 = namespace.lens<TError>('bar', {});

        expect(namespace.disposed).to.eql(false);
        expect(ns2.disposed).to.eql(false);
        expect(ns1.disposed).to.eql(false);

        dispose();

        expect(namespace.disposed).to.eql(true);
        expect(ns2.disposed).to.eql(true);
        expect(ns1.disposed).to.eql(true);
      });

      it('namespace.dispose ← ( method ) ', async () => {
        const doc = await setup();

        const namespace = Doc.ns<TRoot>(doc, ['ns'], (d) => (d.ns = {}));
        const ns1 = namespace.lens<TDoc>('foo', { count: 0 });
        const ns2 = namespace.lens<TError>('bar', {});

        expect(namespace.disposed).to.eql(false);
        expect(ns1.disposed).to.eql(false);
        expect(ns2.disposed).to.eql(false);

        namespace.dispose();

        expect(namespace.disposed).to.eql(true);
        expect(ns1.disposed).to.eql(true);
        expect(ns2.disposed).to.eql(true);
      });

      it('lens.dispose', async () => {
        const doc = await setup();
        const namespace = Doc.ns<TRoot>(doc, ['ns'], (d) => (d.ns = {}));

        const initial: TDoc = { count: 0 };
        const lens1 = namespace.lens('foo', initial);
        const lens2a = namespace.lens('bar', initial);
        const lens2b = namespace.lens('bar', initial);
        expect(lens2a).to.equal(lens2b); // NB: same instance.

        lens2a.dispose();

        expect(namespace.disposed).to.eql(false);
        expect(lens1.disposed).to.eql(false);
        expect(lens2a.disposed).to.eql(true);

        lens2a.change((d) => (d.count = 555));
        expect(lens2a.current).to.eql(undefined);
        expect(Object.keys(namespace.container)).to.eql(['foo']); // NB: does not contain disposed lens

        const lens2c = namespace.lens('bar', initial);
        expect(lens2a).to.not.equal(lens2c); // NB: new instance.
      });

      it('doc.dispose ← ( root store )', async () => {
        const store = Store.init();
        const doc = await setup({ store });

        const namespace = Doc.ns<TRoot>(doc, ['ns'], (d) => (d.ns = {}));
        const ns1 = namespace.lens<TDoc>('foo', { count: 0 });
        const ns2 = namespace.lens<TError>('bar', {});

        expect(store.disposed).to.eql(false);
        expect(namespace.disposed).to.eql(false);
        expect(ns2.disposed).to.eql(false);
        expect(ns1.disposed).to.eql(false);

        store.dispose();

        expect(store.disposed).to.eql(true);
        expect(namespace.disposed).to.eql(true);
        expect(ns2.disposed).to.eql(true);
        expect(ns1.disposed).to.eql(true);
      });

      it('disposal clears { container } → { }', async () => {
        const store = Store.init();
        const doc = await setup({ store });

        const namespace = Doc.ns<TRoot>(doc, ['ns'], (d) => (d.ns = {}));
        namespace.lens<TDoc>('foo', { count: 0 });
        namespace.lens<TError>('bar', {});

        const keys1 = Object.keys(namespace.container);
        store.dispose();
        const keys2 = Object.keys(namespace.container);

        expect(keys1).to.eql(['foo', 'bar']);
        expect(keys2).to.eql([]);
      });

      it('dispose → generate new( 🌳 ) → new instance container: { <empty> }', async () => {
        const store1 = Store.init();
        const store2 = Store.init();

        const doc1 = await setup({ store: store1 });
        const ns1 = Doc.ns<TRoot>(doc1, ['ns'], (d) => (d.ns = {}));

        ns1.lens<TDoc>('foo', { count: 0 });
        ns1.lens<TError>('bar', {});

        expect(Object.keys(ns1.container).length).to.eql(2);
        store1.dispose();
        expect(Object.keys(ns1.container).length).to.eql(0);
        expect(Object.keys(doc1.current.ns ?? {}).length).to.eql(2); // NB: underlying document not changed on disposal.

        const doc2 = await setup({ store: store2 });
        const ns2 = Doc.ns<TRoot>(doc2, ['ns'], (d) => (d.ns = {}));
        expect(Object.keys(ns2.container).length).to.eql(0);
      });
    });

    it('done (clean up)', () => store.dispose());
  },
);
