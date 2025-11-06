import { describe, expect, it } from '../../../-test.ts';
import { Immutable } from '../../m.Immutable/mod.ts';
import { Lens } from '../mod.ts';

type T = {
  count: number;
  foo?: {
    msg?: string;
    count?: number;
    bar?: { count?: number; msg?: string };
  };
};

describe('Lens', () => {
  it('API', async () => {
    const m = await import('@sys/immutable/core');
    expect(m.Immutable.Lens).to.equal(Lens);
  });

  it('root lens reads the entire document', () => {
    const doc = Immutable.cloner<T>({ count: 1, foo: { count: 2 } });
    const root = Lens.at(doc);
    expect(root.get()).to.eql(doc.current);
  });

  it('get/getOr/exists on missing path', () => {
    const doc = Immutable.clonerRef<T>({ count: 0 });
    const missing = Lens.at(doc, ['foo', 'msg']);
    expect(missing.get()).to.eql(undefined);
    expect(missing.getOr('default')).to.eql('default');
    expect(missing.exists()).to.eql(false);
  });

  it('set writes value (creates missing path segments)', () => {
    const doc = Immutable.clonerRef<T>({ count: 0 });
    const msg = Lens.at<string>(doc, ['foo', 'msg']);
    expect(msg.exists()).to.eql(false);
    msg.set('hi');
    expect(doc.current.foo?.msg).to.eql('hi');
    expect(msg.exists()).to.eql(true);

    // Overwrite:
    msg.set('there');
    expect(doc.current.foo?.msg).to.eql('there');
  });

  it('update maps current value → next (works from undefined)', () => {
    const doc = Immutable.clonerRef<T>({ count: 0, foo: {} });
    const msg = Lens.at<string>(doc, ['foo', 'msg']);

    // From undefined:
    msg.update((s) => s ?? 'first');
    expect(doc.current.foo?.msg).to.eql('first');

    // From defined:
    msg.update((s) => `${s}-next`);
    expect(doc.current.foo?.msg).to.eql('first-next');
  });

  it('ensure writes default once and returns value', () => {
    const doc = Immutable.clonerRef<T>({ count: 0, foo: {} });
    const c = Lens.at<number>(doc, ['foo', 'count']);

    // Absent → writes default:
    const first = c.ensure(42);
    expect(first).to.eql(42);
    expect(doc.current.foo?.count).to.eql(42);

    // Present → returns existing, does not overwrite:
    const second = c.ensure(7);
    expect(second).to.eql(42);
    expect(doc.current.foo?.count).to.eql(42);
  });

  it('delete removes key (no-op when absent)', () => {
    const doc = Immutable.clonerRef<T>({ count: 0, foo: { msg: 'x' } });
    const msg = Lens.at<string>(doc, ['foo', 'msg']);

    expect(msg.exists()).to.eql(true);
    msg.delete();
    expect(msg.exists()).to.eql(false);
    expect(doc.current.foo?.msg).to.eql(undefined);

    // No-throw/no-op when already absent:
    msg.delete();
    expect(msg.exists()).to.eql(false);
  });

  it('child() derives sub-lens; as<U>() re-types view only', () => {
    const doc = Immutable.clonerRef<T>({ count: 0, foo: { count: 1 } });
    const a = Lens.at(doc, ['foo']);
    const b = a.child<number>(['count']);
    expect(b.get()).to.eql(1);

    // as<U> does not change path or value, only the compile-time view:
    const c = b.as<string>();
    expect(c.path).to.eql(b.path);
    expect(c.get()).to.eql(1 as unknown as string); // runtime same value; typing differs
  });

  it('child(): nullable segments are ignored; empty/undefined/null → same path', () => {
    const doc = Immutable.clonerRef<T>({ count: 0, foo: { bar: { msg: 'ok' } } });
    const base = Lens.at(doc, ['foo', 'bar']);

    const a = base.child<string>(undefined);
    const b = base.child<string>(null);
    const c = base.child<string>([]);

    expect(a.path).to.eql(base.path);
    expect(b.path).to.eql(base.path);
    expect(c.path).to.eql(base.path);

    // Behavior identical:
    expect(a.at<string>(['msg']).get()).to.eql('ok');
    expect(b.at<string>(['msg']).get()).to.eql('ok');
    expect(c.at<string>(['msg']).get()).to.eql('ok');
  });

  it('child(): nullable segments are ignored; empty/undefined/null → same path', () => {
    const doc = Immutable.clonerRef<T>({ count: 0, foo: { bar: { msg: 'ok' } } });
    const base = Lens.at(doc, ['foo', 'bar']);

    const a = base.child<string>(undefined);
    const b = base.child<string>(null);
    const c = base.child<string>([]);

    expect(a.path).to.eql(base.path);
    expect(b.path).to.eql(base.path);
    expect(c.path).to.eql(base.path);

    // Behavior identical:
    expect(a.at<string>(['msg']).get()).to.eql('ok');
    expect(b.at<string>(['msg']).get()).to.eql('ok');
    expect(c.at<string>(['msg']).get()).to.eql('ok');
  });

  it('instance .at(...segments) appends multiple path arrays in order', () => {
    const doc = Immutable.clonerRef<T>({ count: 0, foo: { bar: { msg: 'ok' } } });

    const base = Lens.at(doc); // root
    const viaAt = base.at<string>(['foo'], ['bar'], ['msg']);
    expect(viaAt.get()).to.eql('ok');

    // Equivalence with single call at construction:
    const direct = Lens.at<string>(doc, ['foo', 'bar', 'msg']);
    expect(viaAt.path).to.eql(direct.path);
    expect(viaAt.get()).to.eql(direct.get());
  });

  it('set/ensure on deeper nested path creates intermediates', () => {
    const doc = Immutable.clonerRef<T>({ count: 0 });

    const deepMsg = Lens.at<string>(doc, ['foo', 'bar', 'msg']);
    expect(deepMsg.exists()).to.eql(false);

    // ensure creates the entire chain:
    deepMsg.ensure('created');
    expect(doc.current.foo?.bar?.msg).to.eql('created');

    // set overwrites:
    deepMsg.set('updated');
    expect(doc.current.foo?.bar?.msg).to.eql('updated');
  });

  it('mixing root and nested operations remains consistent', () => {
    const doc = Immutable.clonerRef<T>({ count: 1, foo: { count: 2 } });

    const root = Lens.at(doc);
    const fooCount = root.at<number>(['foo', 'count']);
    const total = root.at<number>(['count']);

    fooCount.update((n) => (n ?? 0) + 10);
    total.update((n) => (n ?? 0) + 5);

    expect(doc.current.foo?.count).to.eql(12);
    expect(doc.current.count).to.eql(6);
  });

  it('set(undefined) deletes the key (per Path.Mutate.set semantics)', () => {
    const doc = Immutable.clonerRef<T>({ count: 0, foo: { msg: 'keep' } });
    const msg = Lens.at<string | undefined>(doc, ['foo', 'msg']);
    expect(msg.exists()).to.eql(true);

    // Setting undefined should delete the key:
    msg.set(undefined);
    expect(msg.exists()).to.eql(false);
    expect(doc.current.foo?.msg).to.eql(undefined);
  });

  it('instance .at() with no segments returns a lens at the same path', () => {
    const doc = Immutable.clonerRef<T>({ count: 0, foo: { bar: { msg: 'ok' } } });
    const base = Lens.at(doc, ['foo', 'bar']);
    const same = base.at(); // no segments
    expect(same.path).to.eql(base.path);

    // And behavior remains identical:
    const msg1 = base.at<string>(['msg']);
    const msg2 = same.at<string>(['msg']);
    expect(msg1.path).to.eql(msg2.path);
    expect(msg1.get()).to.eql('ok');
    expect(msg2.get()).to.eql('ok');
  });

  it('Lens.at: nullable segments are ignored; only nullish/empty → root path', () => {
    const doc = Immutable.clonerRef<T>({ count: 1, foo: { bar: { msg: 'x' } } });

    const a = Lens.at(doc, undefined, null);
    const b = Lens.at(doc, []); // empty path array
    const c = Lens.at(doc, undefined, [], null);

    expect(a.path).to.eql([]);
    expect(b.path).to.eql([]);
    expect(c.path).to.eql([]);
    expect(a.get()).to.eql(doc.current);
    expect(b.get()).to.eql(doc.current);
    expect(c.get()).to.eql(doc.current);
  });

  it('Lens.at: mixed nullable + concrete segments join in-order', () => {
    const doc = Immutable.clonerRef<T>({ count: 0, foo: { bar: { msg: 'ok' } } });

    const viaNulls = Lens.at<string>(doc, undefined, ['foo'], null, [], ['bar', 'msg'], undefined);

    expect(viaNulls.path).to.eql(['foo', 'bar', 'msg']);
    expect(viaNulls.get()).to.eql('ok');
  });

  it('lens.at: instance variant ignores nullable segments (parity with Lens.at)', () => {
    const doc = Immutable.clonerRef<T>({ count: 0, foo: { bar: { msg: 'ok' } } });
    const base = Lens.at(doc); // root

    const a = base.at<string>(undefined, ['foo'], null, [], ['bar'], ['msg']);
    const b = Lens.at<string>(doc, ['foo'], ['bar'], ['msg']);

    expect(a.path).to.eql(b.path);
    expect(a.get()).to.eql('ok');
  });

  it('numeric path parts: read/write/delete within arrays', () => {
    type TArr = { items?: readonly { id: string; n: number }[] };
    const doc = Immutable.clonerRef<TArr>({
      items: [
        { id: 'a', n: 1 },
        { id: 'b', n: 2 },
      ],
    });

    const n1 = Lens.at<number>(doc as any, ['items', 0, 'n']); // numeric index in ObjectPath
    const n2 = Lens.at<number>(doc as any, ['items', 1, 'n']);

    expect(n1.get()).to.eql(1);
    expect(n2.get()).to.eql(2);

    n1.update((v) => (v ?? 0) + 10);
    expect(n1.get()).to.eql(11);
    expect((doc.current.items ?? [])[0].n).to.eql(11);

    // delete a field via set(undefined)
    n2.set(undefined as any);
    expect(n2.exists()).to.eql(false);
    expect((doc.current.items ?? [])[1].n).to.eql(undefined);
  });

  it('lens.doc is the same Immutable ref instance (identity)', () => {
    const doc = Immutable.clonerRef<T>({ count: 1 });
    const lens = Lens.at(doc, ['count']);
    expect(lens.doc).to.equal(doc); // identity/same instance
  });

  it('root equivalence: Lens.at(doc) ≡ Lens.at(doc, undefined, [], null)', () => {
    const doc = Immutable.clonerRef<T>({ count: 1 });
    const a = Lens.at(doc);
    const b = Lens.at(doc, undefined, [], null);

    expect(a.path).to.eql(b.path);
    expect(a.get()).to.eql(b.get());
  });
});
