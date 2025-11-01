import { A, describe, expect, it, Obj } from '../../-test.ts';
import { toObject } from '../u.toObject.ts';
import { testRepo } from './-u.ts';

describe('Crdt.toObject', { sanitizeResources: false, sanitizeOps: false }, () => {
  const decoupled = (original: any, plain: any, mutate: (x: any) => void) => {
    const snapshot = Obj.clone(original);
    mutate(plain);
    expect(original).to.eql(snapshot); // deep-equal unchanged after mutating the plain clone
  };

  it('Crdt.Ref<T> → plain POJO (decoupled)', () => {
    // given
    type T = { count: number; nested?: { label: string } };
    const repo = testRepo();
    const doc = repo.create<T>({ count: 0, nested: { label: 'x' } });

    // when
    const plain = toObject<T>(doc);

    // then
    expect(plain).to.eql({ count: 0, nested: { label: 'x' } });
    expect(plain).to.not.equal(doc.current); // different reference
    decoupled(doc.current, plain, (x) => {
      x.count = 42;
      x.nested.label = 'y';
    });
  });

  it('doc.current (AM proxy) → plain POJO (decoupled)', () => {
    type T = { values: readonly number[] };
    const repo = testRepo();
    const doc = repo.create<T>({ values: [1, 2, 3] });

    const plain = toObject<T>(doc.current);

    expect(plain).to.eql({ values: [1, 2, 3] });
    expect(plain.values).to.not.equal(doc.current.values); // array cloned
    decoupled(doc.current, plain, (x) => {
      (x.values as number[]).push(4);
    });
  });

  it('already-plain object → returns plain object (id not required, shape preserved)', () => {
    // For plain input we only assert shape and decoupling behavior semantically.
    type T = { name: string; flags: { a: boolean; b: boolean } };
    const plainInput: T = { name: 'alpha', flags: { a: true, b: false } };

    const plain = toObject<T>(plainInput);

    expect(plain).to.eql(plainInput);
    // Note: implementation may return same or cloned reference depending on Automerge.toJS availability.
    // We only require that mutating the returned value does not affect any CRDT doc (none here).
  });

  it('nullish → {} as T', () => {
    type T = { any?: string };
    const a = toObject<T>(undefined);
    const b = toObject<T>(null as unknown as T);
    expect(a).to.eql({});
    expect(b).to.eql({});
  });

  it('deep materialization: maps, arrays, and nested objects', () => {
    type Item = { id: string; n: number };
    type T = {
      items: readonly Item[];
      meta: { tags: readonly string[]; info: { kind: 'k' } };
    };

    const repo = testRepo();
    const doc = repo.create<T>({
      items: [
        { id: 'a', n: 1 },
        { id: 'b', n: 2 },
      ],
      meta: { tags: ['x', 'y'], info: { kind: 'k' } },
    });

    const out = toObject<T>(doc);

    expect(out.items).to.eql([
      { id: 'a', n: 1 },
      { id: 'b', n: 2 },
    ]);
    expect(out.meta).to.eql({ tags: ['x', 'y'], info: { kind: 'k' } });
    // arrays/objects should be new references (not AM proxy structures):
    expect(out.items).to.not.equal(doc.current.items);
    expect(out.meta).to.not.equal(doc.current.meta);

    // prove decoupling via mutation of the plain copy:
    decoupled(doc.current, out, (x) => {
      (x.items as Item[]).push({ id: 'c', n: 3 });
      (x.meta.tags as string[]).push('z');
      x.meta.info.kind = 'k2';
    });
  });

  it('passes through non-CRDT inputs unchanged (identity preserved)', () => {
    const plain = { a: 1 };
    const date = new Date(0);
    const arr = [1, 2, 3];

    expect(toObject({})).to.eql({});
    expect(toObject(plain)).to.equal(plain);
    expect(toObject(date as any)).to.equal(date);
    expect(toObject(arr as any)).to.equal(arr);
  });

  it('nested AM subtree (non-root) → plain POJO (decoupled)', () => {
    type T = { view: { programme: { title: string; items: readonly { id: string }[] } } };
    const repo = testRepo();
    const doc = repo.create<T>({
      view: { programme: { title: 'p', items: [{ id: 'a' }, { id: 'b' }] } },
    });

    // Sanity: ensure input is actually an AM-proxied nested value
    const nested = doc.current.view.programme as unknown;
    const isAM = A.getObjectId ? !!A.getObjectId(nested) : false;
    expect(isAM).to.eql(true);

    // When: convert nested (non-root) proxy
    const plain = toObject<typeof doc.current.view.programme>(doc.current.view.programme);

    // Then: clean POJO, deep-equal content, new refs vs AM proxies
    expect(plain).to.eql({ title: 'p', items: [{ id: 'a' }, { id: 'b' }] });
    expect(plain).to.not.equal(doc.current.view.programme);
    expect(plain.items).to.not.equal(doc.current.view.programme.items);

    // And: decoupled — mutating plain does not affect doc
    const before = Obj.clone(doc.current);
    (plain.items as { id: string }[]).push({ id: 'c' });
    plain.title = 'q';
    expect(doc.current).to.eql(before);
  });
});
