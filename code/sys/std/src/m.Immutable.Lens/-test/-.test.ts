import { describe, expect, it } from '../../-test.ts';
import { Immutable } from '../../m.Immutable/mod.ts';
import { Lens } from '../mod.ts';

type T = {
  count: number;
  foo?: {
    count?: number;
    msg?: string;
    bar?: { count?: number; msg?: string };
  };
};

describe('Lens', () => {
  it('API re-export', async () => {
    const m = await import('@sys/std/immutable');
    expect(m.Lens).to.equal(Lens);
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
});
