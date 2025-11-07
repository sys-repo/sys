import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Lens } from '../mod.ts';

describe('Lens.toObject', () => {
  describe('Lens.toObject (types)', () => {
    const v: any = undefined;

    type S = { a: { b: number }; arr: readonly string[] };
    type RW = t.ObjLensRef<S, number>;
    type RO = t.ReadOnlyObjLensRef<S, string>;

    type Mixed = {
      keep: { z: boolean };
      rw: RW;
      ro: RO;
      list: readonly [RO, number];
      date: Date;
    };

    type Out = t.UnwrapLenses<Mixed>;

    it('unwraps lens value types', () => {
      expectTypeOf<Out['rw']>(v).toEqualTypeOf<number>();
      expectTypeOf<Out['ro']>(v).toEqualTypeOf<string>();
    });

    it('preserves tuple/array element types and readonly tuple', () => {
      expectTypeOf<Out['list']>(v).toEqualTypeOf<readonly [string, number]>();
      type First = Out['list'][0];
      type Second = Out['list'][1];
      expectTypeOf<First>(v).toEqualTypeOf<string>();
      expectTypeOf<Second>(v).toEqualTypeOf<number>();
    });

    it('recurses plain objects, preserving shape', () => {
      expectTypeOf<Out['keep']['z']>(v).toEqualTypeOf<boolean>();
    });

    it('preserves non-plain instances as-is', () => {
      expectTypeOf<Out['date']>(v).toEqualTypeOf<Date>();
    });
  });

  it('replaces bound lens refs (RW) with .get() values', () => {
    const subject = { a: { b: 123 } };
    const root = Lens.bind(subject);
    const tree = { x: root.at('/a/b') };

    const out = Lens.toObject(tree);
    expect(out).to.eql({ x: 123 });
  });

  it('replaces bound lens refs (RO) with .get() values', () => {
    const subject = { a: { b: 1 }, arr: [7, 8] };
    const ro = Lens.ReadOnly.bind(subject);
    const tree = {
      one: ro.at('/a/b'),
      arr: [ro.at('/arr/0'), 'k'],
      deep: { two: ro.at('/arr/1') },
    };

    const out = Lens.toObject(tree);
    expect(out).to.eql({ one: 1, arr: [7, 'k'], deep: { two: 8 } });
  });

  it('mixed structure: preserves non-lens values, unwraps lenses', () => {
    const subject = { a: { b: 'ok' } };
    const rw = Lens.bind(subject);
    const tree = {
      keep: 'v',
      n: 42,
      lens: rw.at('/a/b'),
      nested: { inner: rw.at('/a') },
      list: [1, rw.at('/a/b'), { k: rw.at('/a/b') }],
    };

    const out = Lens.toObject(tree);
    expect(out).to.eql({
      keep: 'v',
      n: 42,
      lens: 'ok',
      nested: { inner: { b: 'ok' } },
      list: [1, 'ok', { k: 'ok' }],
    });
  });

  it('skips accessor getters by default; includes when requested', () => {
    const subject = { x: 1 };
    const ro = Lens.ReadOnly.bind(subject);
    const withGetter = {
      lens: ro.at('/x'),
    } as any;

    Object.defineProperty(withGetter, 'g', {
      get() {
        return 99;
      },
      enumerable: true,
    });

    // default: getter skipped
    const out1 = Lens.toObject(withGetter);
    expect(out1).to.eql({ lens: 1 });

    // includeGetters: getter included
    const out2 = Lens.toObject(withGetter, { includeGetters: true });
    expect(out2).to.eql({ lens: 1, g: 99 });
  });

  it('depth guard: limits recursion (lenses still unwrap at current depth)', () => {
    const subject = { a: { b: { c: 3 } } };
    const ro = Lens.ReadOnly.bind(subject);

    // depth=1: unwrap lens to value once, but do not recurse into resulting object
    const out1 = Lens.toObject({ x: ro.at('/a') }, { depth: 1 });
    // The lens unwraps to { b: { c: 3 } }, but no further descent → as-is object
    expect(out1).to.eql({ x: { b: { c: 3 } } });

    // depth=0: anything visited returns undefined
    const out0 = Lens.toObject({ x: ro.at('/a') }, { depth: 0 });
    expect(out0).to.equal(undefined);
  });

  it('cycle guard: preserves object identity on cycles', () => {
    const subject = { n: 1 };
    const ro = Lens.ReadOnly.bind(subject);

    const a: any = { self: null, lens: ro.at('/n') };
    a.self = a;

    const out = Lens.toObject(a);
    expect(out.self).to.equal(out); // cycle preserved
    expect(out.lens).to.equal(1);
  });

  it('preserves non-POJO instances as-is (Date/Map)', () => {
    const d = new Date('2020-01-01T00:00:00.000Z');
    const m = new Map<string, number>([['a', 1]]);
    const subject = { when: 1 };
    const ro = Lens.ReadOnly.bind(subject);

    const tree = { d, m, lens: ro.at('/when') };
    const out = Lens.toObject(tree);

    // identity preserved
    expect(out.d).to.equal(d);
    expect(out.m).to.equal(m);
    expect(out.lens).to.equal(1);
  });

  it('unbound lens is not unwrapped and remains intact', () => {
    const unbound = Lens.at('/a/b');
    const tree = { unbound };
    const out = Lens.toObject(tree);
    expect(out.unbound).to.equal(unbound);
    expect(Lens.Is.lens(out.unbound)).to.equal(true);
    expect(Lens.Is.lensRef(out.unbound)).to.equal(false);
  });
});
