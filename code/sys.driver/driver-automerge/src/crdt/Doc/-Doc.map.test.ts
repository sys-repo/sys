import { describe, expect, Immutable, it, rx, type t } from '../../-test.ts';
import { Doc } from './mod.ts';
import { testSetup, type D, type DChild } from './-TEST.u.ts';

describe(
  'Doc.map (composite)',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeResources: false, sanitizeOps: false },

  () => {
    const { store, factory } = testSetup();
    type F = { foo: number; text?: string };

    describe('Is (flags)', () => {
      it('Is.immutableRef', async () => {
        const doc = await factory();
        const map = Doc.map<F>({ foo: [doc, 'count'], text: [doc, 'msg'] });
        expect(Immutable.Is.immutableRef(map)).to.eql(true);
        expect(Immutable.Is.map(map)).to.eql(true);
        expect(Immutable.Is.proxy(map.current)).to.eql(true);
      });

      it('Doc.Is.map', async () => {
        const doc = await factory();
        const map = Doc.map<F>({ foo: [doc, 'count'], text: [doc, 'msg'] });
        expect(Doc.Is.map(map)).to.eql(true);
        expect(Doc.Is.proxy(map.current)).to.eql(true);
      });
    });

    describe('IO', () => {
      it('read/write', async () => {
        const doc = await factory();
        const map = Doc.map<F>({ foo: [doc, 'count'], text: [doc, 'msg'] });

        expect(map.current.foo).to.eql(0);
        expect(map.current.text).to.eql(undefined);

        map.change((d) => {
          d.foo = 555;
          d.text = 'hello';
        });

        expect(map.current.foo).to.eql(555);
        expect(map.current.text).to.eql('hello');
        expect(Doc.toObject(map)).to.eql({ foo: 555, text: 'hello' });
      });

      it('patches (callback)', async () => {
        const doc = await factory();
        const map = Doc.map<F>({ foo: [doc, 'count'], text: [doc, 'msg'] });

        const patches: t.Patch[] = [];
        map.change(
          (d) => (d.foo = 123),
          (e) => patches.push(...e),
        );

        expect(patches.length).to.eql(1);
        expect(patches[0].path).to.eql(['count']);
        expect(patches[0].action).to.eql('put');
      });

      it('toObject', async () => {
        const doc = await factory();
        const map = Doc.map<F>({ foo: [doc, 'count'], text: [doc, 'msg'] });

        map.change((d) => {
          d.foo = 123;
          d.text = 'hello';
        });

        const obj1 = Doc.toObject(map);
        const obj2 = Doc.toObject(map.current);
        expect(obj1).to.eql({ foo: 123, text: 'hello' });
        expect(obj2).to.eql({ foo: 123, text: 'hello' });
      });
    });

    describe('composition', () => {
      it('composite of multiple CRDT documents', async () => {
        const doc1 = await factory();
        const doc2 = await factory();
        const map = Doc.map<F>({ foo: [doc1, 'count'], text: [doc2, 'msg'] });

        expect(map.current.foo).to.eql(0);
        expect(map.current.text).to.eql(undefined);

        doc1.change((d) => (d.count = 123));
        doc2.change((d) => (d.msg = 'hello'));

        expect(map.current.foo).to.eql(123);
        expect(map.current.text).to.eql('hello');
      });

      it('composite of multiple CRDT documents and lens', async () => {
        const doc1 = await factory();
        const doc2 = await factory();
        const lens = Doc.lens<D, DChild>(doc2, ['child']);

        const map = Doc.map<F>({ foo: [doc1, 'count'], text: [lens, 'msg'] });

        expect(map.current.foo).to.eql(0);
        expect(map.current.text).to.eql(undefined);

        doc1.change((d) => (d.count = 123));
        lens.change((d) => (d.msg = 'hello'));

        expect(map.current.foo).to.eql(123);
        expect(map.current.text).to.eql('hello');
        expect(Doc.toObject(map)).to.eql({ foo: 123, text: 'hello' });

        map.change((d) => {
          d.foo = 456;
          d.text = 'banger';
        });

        expect(doc1.current.count).to.eql(456);
        expect(lens.current.msg).to.eql('banger');
      });

      it('composite maps of maps', async () => {
        type A = F;
        type B = { length: number; message: string };
        const doc = await factory();
        const lens = Doc.lens<D, DChild>(doc, ['child']);
        const map1 = Doc.map<A>({ foo: [doc, 'count'], text: [lens, 'msg'] });
        const map2 = Doc.map<B>({ length: [map1, 'foo'], message: [map1, 'text'] });

        expect(Doc.toObject(map2)).to.eql({ length: 0, message: undefined });

        map2.change((d) => {
          d.length = 123;
          d.message = 'hello';
        });

        expect(map1.current.foo).to.eql(123);
        expect(map1.current.text).to.eql('hello');
        expect(lens.current.msg).to.eql('hello');
      });
    });

    describe('events', () => {
      type E = t.ImmutableChange<F, t.DocMapPatch>;

      it('map.change → events ⚡️before/after', async () => {
        const { dispose, dispose$ } = rx.lifecycle();
        const doc = await factory();
        const map = Doc.map<F>({ foo: [doc, 'count'], text: [doc, 'msg'] });

        const fired: E[] = [];
        const events = map.events(dispose$);
        events.changed$.subscribe((e) => fired.push(e));

        map.change((d) => (d.foo = 888));
        map.change((d) => (d.text = 'hello'));

        expect(fired.length).to.equal(2);
        expect(fired[0].before.foo).to.eql(0);
        expect(fired[0].before.text).to.eql(undefined);
        expect(fired[0].after.foo).to.eql(888);
        expect(fired[0].after.text).to.eql(undefined);

        expect(fired[1].before.foo).to.eql(888);
        expect(fired[1].before.text).to.eql(undefined);
        expect(fired[1].after.foo).to.eql(888);
        expect(fired[1].after.text).to.eql('hello');

        dispose();
      });

      it('doc.change: events fire when mapped source-documents change', async () => {
        const { dispose, dispose$ } = rx.lifecycle();
        const doc1 = await factory();
        const doc2 = await factory();
        const map = Doc.map<F>({ foo: [doc1, 'count'], text: [doc2, 'msg'] });

        const fired: E[] = [];
        const events = map.events(dispose$);
        events.changed$.subscribe((e) => fired.push(e));
        const mapping = (event: t.Index, patch: t.Index) => fired[event].patches[patch].mapping;

        doc1.change((d) => (d.count = 123));

        expect(fired.length).to.eql(1);
        expect(fired[0].before).to.eql({ foo: 0 });
        expect(fired[0].after).to.eql({ foo: 123 });
        expect(mapping(0, 0).key).to.eql('foo');
        expect(mapping(0, 0).doc).to.eql(doc1.uri);

        doc2.change((d) => (d.count = 123));
        expect(fired.length).to.eql(1); // NB: no change, doc2.count is not mapped.

        doc2.change((d) => (d.msg = 'hello'));

        expect(fired.length).to.eql(2);
        expect(fired[1].before).to.eql({ foo: 123 });
        expect(fired[1].after).to.eql({ foo: 123, text: 'hello' });
        expect(mapping(1, 0).key).to.eql('text');
        expect(mapping(1, 0).doc).to.eql(doc2.uri);
        expect(mapping(1, 1).doc).to.eql(doc2.uri);

        dispose();
      });

      it('patches formatted with document URIs', async () => {
        const { dispose, dispose$ } = rx.lifecycle();
        const doc1 = await factory();
        const doc2 = await factory();
        const map = Doc.map<F>({ foo: [doc1, 'count'], text: [doc2, 'msg'] });

        const fired: E[] = [];
        const events = map.events(dispose$);
        events.changed$.subscribe((e) => fired.push(e));

        map.change((d) => {
          d.foo = 888;
          d.text = 'hello';
        });

        expect(fired.length).to.eql(2);

        expect(fired[0].patches[0].path).to.eql(['count']);
        expect(fired[1].patches[0].path).to.eql(['msg']);
        expect(fired[1].patches[0].path).to.eql(['msg']);
        expect(fired[1].patches[1].path).to.eql(['msg', 0]);

        expect(fired[0].patches[0].mapping.doc).to.eql(doc1.uri);
        expect(fired[1].patches[0].mapping.doc).to.eql(doc2.uri); // NB: composite from multiple documents.
        expect(fired[1].patches[1].mapping.doc).to.eql(doc2.uri);

        expect(fired[0].patches[0].mapping.key).to.eql('foo');
        expect(fired[1].patches[0].mapping.key).to.eql('text');
        expect(fired[1].patches[1].mapping.key).to.eql('text');

        dispose();
      });
    });

    it('|test.dispose|', () => store.dispose());
  },
);
