import { describe, expect, it, type t } from '../-test.ts';
import { rx } from './common.ts';
import { Immutable } from './mod.ts';

describe('Immutable.map', () => {
  type P = t.PatchOperation;
  type TChild = { msg?: string };
  type D = { count: number; child?: TChild };
  type F = { foo: number; text: string };

  it('instance (id)', () => {
    const doc = Immutable.clonerRef<D>({ count: 0 });
    const map = Immutable.map<F>({ foo: [doc, 'count'], text: [doc, ['child', 'msg']] });
    expect(map.instance).to.be.a('String');
    expect(map.instance).to.not.eql(doc.instance);
  });

  describe('read/write', () => {
    it('read (current)', () => {
      const doc = Immutable.clonerRef<D>({ count: 0 });
      const map = Immutable.map<F>({ foo: [doc, 'count'], text: [doc, ['child', 'msg']] });

      expect(map.current.foo).to.eql(0);
      expect(map.current.text).to.eql(undefined);
      expect((map.current as any).zoo).to.eql(undefined); // NB: does not exist.

      // Change underlying doc.
      doc.change((d) => {
        d.count = 123;
        d.child = { msg: 'hello' };
      });

      expect(map.current.foo).to.eql(123);
      expect(map.current.text).to.eql('hello');
    });

    it('write: immutable change', () => {
      const doc = Immutable.clonerRef<D>({ count: 0 });
      const map = Immutable.map<F>({ foo: [doc, 'count'], text: [doc, ['child', 'msg']] });

      expect(doc.current.count).to.eql(0);
      expect(map.current.foo).to.eql(0);

      map.change((d) => (d.foo = 123));

      expect(doc.current.count).to.eql(123);
      expect(map.current.foo).to.eql(123);
    });

    it('write: change sub-object within map', () => {
      type F = { foo: TChild };
      const doc = Immutable.clonerRef<D>({ count: 0, child: {} });
      const map = Immutable.map<F>({ foo: [doc, 'child'] });

      map.change((d) => (d.foo.msg = 'hello'));
      expect(doc.current.child?.msg).to.eql('hello');
    });

    it('write: patches callback', () => {
      const doc = Immutable.clonerRef<D>({ count: 0 });
      const map = Immutable.map<F>({ foo: [doc, 'count'], text: [doc, ['child', 'msg']] });
      const patches: P[] = [];
      map.change(
        (d) => {
          d.foo = 123;
          d.text = 'hello';
        },
        (e) => patches.push(...e),
      );
      expect(map.current.foo).to.eql(123);
      expect(map.current.text).to.eql('hello');

      expect(patches.length).to.eql(2);
      expect(patches[0].path).to.eql('/count'); // NB: patches pertain to the underlying target.
      expect(patches[1].path).to.eql('/child');
    });
  });

  describe('composite', () => {
    it('subset of two documents', () => {
      const doc1 = Immutable.clonerRef<D>({ count: 123 });
      const doc2 = Immutable.clonerRef<D>({ count: 0, child: { msg: 'hello' } });
      const map = Immutable.map<F>({ foo: [doc1, ['count']], text: [doc2, ['child', 'msg']] });

      expect(map.current.foo).to.eql(123);
      expect(map.current.text).to.eql('hello');

      map.change((d) => {
        d.foo = 456;
        d.text = 'hazaar';
      });

      expect(map.current.foo).to.eql(456);
      expect(map.current.text).to.eql('hazaar');

      expect(doc1.current.count).to.eql(456);
      expect(doc2.current.child!.msg).to.eql('hazaar');
    });

    it('map to deep sub-paths', () => {
      type F = { total: number; msg?: string };
      const doc = Immutable.clonerRef<D>({ count: 0, child: { msg: 'hello' } });
      const map = Immutable.map<F>({ total: [doc, 'count'], msg: [doc, ['child', 'msg']] });
      expect(map.current.msg).to.eql('hello');

      map.change((d) => (d.msg = 'wowow'));
      expect(map.current.msg).to.eql('wowow');
      expect(doc.current.child?.msg).to.eql('wowow');
    });

    it('map of maps', () => {
      type A = { total: number; msg?: string };
      type B = { message?: string };
      const doc = Immutable.clonerRef<D>({ count: 0, child: { msg: 'hello' } });
      const map1 = Immutable.map<A>({ total: [doc, 'count'], msg: [doc, ['child', 'msg']] });
      const map2 = Immutable.map<B>({ message: [map1, 'msg'] });

      expect(map2.current.message).to.eql('hello');
      map1.change((d) => (d.msg = 'aaa'));
      expect(map2.current.message).to.eql('aaa');

      map2.change((d) => (d.message = 'bbb'));
      expect(map1.current.msg).to.eql('bbb');
    });
  });

  describe('reflection', () => {
    it('Object.keys ← Reflect.ownKeys', () => {
      const doc = Immutable.clonerRef<D>({ count: 0, child: { msg: 'hello' } });
      const map = Immutable.map<F>({ foo: [doc, 'count'], text: [doc, ['child', 'msg']] });
      expect(Object.keys(map.current)).to.eql(['foo', 'text']);
    });

    it('Object.getOwnPropertyDescriptor', () => {
      const doc = Immutable.clonerRef<D>({ count: 0, child: { msg: 'hello' } });
      const map = Immutable.map<F>({ foo: [doc, 'count'], text: [doc, ['child', 'msg']] });

      const getDescriptor = () => Object.getOwnPropertyDescriptor(map.current, 'foo');
      expect(getDescriptor()?.value).to.eql(0);

      map.change((d) => (d.foo = 123));
      expect(getDescriptor()?.value).to.eql(123);
    });

    it('Is.map', () => {
      const doc = Immutable.clonerRef<D>({ count: 0, child: { msg: 'hello' } });
      const map = Immutable.map<F>({ foo: [doc, 'count'], text: [doc, ['child', 'msg']] });

      expect(Immutable.Is.map(map)).to.eql(true);

      const NON = [true, 123, {}, [], Symbol('foo'), BigInt(0)];
      NON.forEach((value) => expect(Immutable.Is.map(value)).to.eql(false));
    });

    it('Is.proxy', () => {
      const doc = Immutable.clonerRef<D>({ count: 0, child: { msg: 'hello' } });
      const map = Immutable.map<F>({ foo: [doc, 'count'], text: [doc, ['child', 'msg']] });

      expect(Immutable.Is.proxy(map)).to.eql(false);
      expect(Immutable.Is.proxy(map.current)).to.eql(true);

      const NON = [true, 123, {}, [], Symbol('foo'), BigInt(0)];
      NON.forEach((value) => expect(Immutable.Is.map(value)).to.eql(false));
    });

    it('Immutable.toObject', () => {
      const doc = Immutable.clonerRef<D>({ count: 123, child: { msg: 'hello' } });
      const map = Immutable.map<F>({ foo: [doc, 'count'], text: [doc, ['child', 'msg']] });

      const obj1 = Immutable.toObject(map);
      const obj2 = Immutable.toObject(map.current);
      const obj3 = Immutable.Map.toObject(map);

      expect(obj1).to.eql(obj2);
      expect(obj1).to.eql(obj3);
      expect(obj1).to.eql({ foo: 123, text: 'hello' });
      expect(map.toObject()).to.eql(Immutable.toObject(map));
    });
  });

  describe('internal (private API)', () => {
    it('retrieve API → {mapping}', () => {
      const doc = Immutable.clonerRef<D>({ count: 0, child: { msg: 'hello' } });
      const mapping: t.ImmutableMapping<F, P> = {
        foo: [doc, 'count'],
        text: [doc, ['child', 'msg']],
      };
      const map = Immutable.map<F>(mapping);

      const NON = [true, 123, {}, [], Symbol('foo'), BigInt(0)];
      NON.forEach((v: any) => expect(Immutable.Map.internal(v)).to.eql(undefined));

      const api = Immutable.Map.internal(map);
      expect(api?.mapping).to.equal(mapping);
    });

    it('origin ← root mapped source', () => {
      type A = { a?: string };
      type B = { b?: string };

      const doc = Immutable.clonerRef<D>({ count: 0, child: { msg: 'before' } });
      const map1 = Immutable.map<A>({ a: [doc, ['child', 'msg']] });
      const map2 = Immutable.map<B>({ b: [map1, 'a'] });

      const api1 = Immutable.Map.internal(map1)!;
      const api2 = Immutable.Map.internal(map2)!;

      expect(api1.origin('404')).to.eql(undefined);

      const res1 = api1.origin('a');
      const res2 = api2.origin('b');

      expect(res1?.doc).to.equal(doc); // NB: direct link back to source.
      expect(res1?.key).to.eql('a');
      expect(res1?.path).to.eql(['child', 'msg']);

      expect(res2?.doc).to.equal(doc); // NB: mapped through another item before source.
      expect(res2?.key).to.eql('a');
      expect(res2?.path).to.eql(['child', 'msg']);
    });
  });

  describe('events', () => {
    type E = t.ImmutableChange<F, t.PatchOperation>;
    type P = t.ImmutableMapPatchDefault;

    it('change → events ⚡️before/after', () => {
      const { dispose, dispose$ } = rx.lifecycle();
      const doc = Immutable.clonerRef<D>({ count: 0, child: {} });
      const map = Immutable.map<F>({ foo: [doc, 'count'], text: [doc, ['child', 'msg']] });

      const firedDoc: t.ImmutableChange<D, t.PatchOperation>[] = [];
      const firedMap: E[] = [];
      const events = {
        doc: doc.events(dispose$),
        map: map.events(dispose$),
      } as const;
      events.doc.changed$.subscribe((e) => firedDoc.push(e));
      events.map.changed$.subscribe((e) => firedMap.push(e));

      map.change((d) => (d.foo = 888));
      map.change((d) => (d.text = 'hello'));

      expect(firedMap.length).to.equal(2);
      expect(firedDoc.length).to.equal(2);
      expect(firedDoc).to.not.eql(firedMap); // NB: the map-patches contain extra meta-data no in the doc-patches.

      expect(firedMap[0].before.foo).to.eql(0);
      expect(firedMap[0].before.text).to.eql(undefined);
      expect(firedMap[0].after.foo).to.eql(888);
      expect(firedMap[0].after.text).to.eql(undefined);

      expect(firedMap[1].before.foo).to.eql(888);
      expect(firedMap[1].before.text).to.eql(undefined);
      expect(firedMap[1].after.foo).to.eql(888);
      expect(firedMap[1].after.text).to.eql('hello');

      expect(firedDoc[1].after).to.eql({ count: 888, child: { msg: 'hello' } });
      dispose();
    });

    it('event patches include mapping info', () => {
      const { dispose, dispose$ } = rx.lifecycle();
      const doc1 = Immutable.clonerRef<D>({ count: 0 });
      const doc2 = Immutable.clonerRef<D>({ count: 0, child: { msg: 'hello' } });
      const map = Immutable.map<F>({ foo: [doc1, ['count']], text: [doc2, ['child', 'msg']] });

      const fired: E[] = [];
      const events = map.events(dispose$);
      events.changed$.subscribe((e) => fired.push(e));

      map.change((d) => {
        d.foo = 123;
        d.text = 'world!';
      });

      expect(fired.length).to.eql(2);

      const p1 = fired[0].patches[0] as P;
      const p2 = fired[1].patches[0] as P;
      expect(fired.length).to.eql(2);

      expect(p1.mapping.key).to.eql('foo');
      expect(p2.mapping.key).to.eql('text');

      expect(p1.mapping.doc).to.eql(`instance:${doc1.instance}`);
      expect(p2.mapping.doc).to.eql(`instance:${doc2.instance}`); // NB: indicates where the change was actually written to.

      dispose();
    });

    it('custom event patch formatter', () => {
      const { dispose, dispose$ } = rx.lifecycle();
      const doc = Immutable.clonerRef<D>({ count: 0 });

      const formatPatch: t.ImmutableMapFormatPatch<P> = (e) => {
        const key = `test-${e.key}`;
        const doc = `uri:wow`;
        return { ...e.patch, mapping: { key, doc } };
      };

      const map = Immutable.map<F, P>(
        { foo: [doc, ['count']], text: [doc, ['child', 'msg']] },
        { formatPatch },
      );

      const fired: E[] = [];
      const events = map.events(dispose$);
      events.changed$.subscribe((e) => fired.push(e));

      map.change((d) => (d.foo = 123));

      const patches = fired[0].patches as P[];
      expect(patches[0].mapping.key).to.eql('test-foo');
      expect(patches[0].mapping.doc).to.eql('uri:wow');

      dispose();
    });

    it('events fire when mapped targets change', () => {
      const { dispose, dispose$ } = rx.lifecycle();
      const doc1 = Immutable.clonerRef<D>({ count: 0 });
      const doc2 = Immutable.clonerRef<D>({ count: 0, child: { msg: 'hello' } });
      const map = Immutable.map<F>({
        foo: [doc1, ['count']],
        text: [doc2, ['child', 'msg']],
      });

      const fired: E[] = [];
      const events = map.events(dispose$);
      events.changed$.subscribe((e) => fired.push(e));

      doc1.change((d) => (d.count = 123));

      expect(fired.length).to.eql(1);
      expect(fired[0].before).to.eql({ foo: 0, text: 'hello' });
      expect(fired[0].after).to.eql({ foo: 123, text: 'hello' });

      const p1 = fired[0].patches[0] as P;
      expect(p1.path).to.eql('/count'); // NB: path to source doc, not the map.
      expect(p1.mapping.doc).to.eql(`instance:${doc1.instance}`);
      expect(p1.mapping.key).to.eql(`foo`);

      doc2.change((d) => (d.child!.msg = 'wow'));

      expect(fired.length).to.eql(2);
      expect(fired[1].before).to.eql({ foo: 123, text: 'hello' });
      expect(fired[1].after).to.eql({ foo: 123, text: 'wow' });

      const p2 = fired[1].patches[0] as P;
      expect(p2.path).to.eql('/child/msg'); // NB: path to source doc, not the map.
      expect(p2.mapping.doc).to.eql(`instance:${doc2.instance}`);
      expect(p2.mapping.key).to.eql(`text`);

      map.change((d) => (d.foo = 456));
      expect(fired.length).to.eql(3); // NB: de-duped, writing to map OR doc does not produce extra events.

      dispose();
    });

    it('events fire through map of maps', () => {
      type A = { a?: string };
      type B = { b?: string };
      type C = { c?: string };

      const { dispose, dispose$ } = rx.lifecycle();
      const doc = Immutable.clonerRef<D>({ count: 0, child: { msg: 'before' } });
      const mapA = Immutable.map<A>({ a: [doc, ['child', 'msg']] });
      const mapB = Immutable.map<B>({ b: [mapA, 'a'] });
      const mapC = Immutable.map<C>({ c: [mapB, 'b'] });

      const firedA: t.ImmutableChange<A, t.PatchOperation>[] = [];
      const firedB: t.ImmutableChange<B, t.PatchOperation>[] = [];
      const firedC: t.ImmutableChange<B, t.PatchOperation>[] = [];
      const eventsA = mapA.events(dispose$);
      const eventsB = mapB.events(dispose$);
      const eventsC = mapB.events(dispose$);
      eventsA.changed$.subscribe((e) => firedA.push(e));
      eventsB.changed$.subscribe((e) => firedB.push(e));
      eventsC.changed$.subscribe((e) => firedC.push(e));

      expect(mapA.current.a).to.eql('before');
      expect(mapB.current.b).to.eql('before');
      expect(mapC.current.c).to.eql('before');

      const expectFired = (total: number) => {
        expect(firedA.length).to.eql(total);
        expect(firedB.length).to.eql(total);
        expect(firedC.length).to.eql(total);
      };

      mapA.change((d) => (d.a = 'changed.A'));
      expectFired(1);
      expect(firedA[0].before.a).to.eql('before');
      expect(firedA[0].after.a).to.eql('changed.A');
      expect(firedB[0].before.b).to.eql('before');
      expect(firedB[0].after.b).to.eql('changed.A');
      expect(firedC[0].before.b).to.eql('before');
      expect(firedC[0].after.b).to.eql('changed.A');

      mapB.change((d) => (d.b = 'changed.B'));
      expectFired(2);
      expect(firedA[1].before.a).to.eql('changed.A');
      expect(firedA[1].after.a).to.eql('changed.B');
      expect(firedB[1].before.b).to.eql('changed.A');
      expect(firedB[1].after.b).to.eql('changed.B');
      expect(firedC[1].before.b).to.eql('changed.A');
      expect(firedC[1].after.b).to.eql('changed.B');

      expect(mapA.current.a).to.eql('changed.B');
      expect(mapB.current.b).to.eql('changed.B');
      expect(mapC.current.c).to.eql('changed.B');

      dispose();
    });
  });
});
