import { type t, describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { makeRegistry } from '../mod.ts';

describe('SlugViewRegistry', () => {
  it('make: returns registry shape', () => {
    const reg = makeRegistry();
    expectTypeOf(reg).toEqualTypeOf<t.SlugViewRegistry>();
    expect(reg.list()).to.eql([]);
  });

  it('get: <unknown> id → undefined', () => {
    const reg = makeRegistry();
    expect(reg.get('nope')).to.eql(undefined);
  });

  it('get: <undefined> id → undefined', () => {
    const reg = makeRegistry();
    expect(reg.get()).to.eql(undefined);
  });

  it('register/get: returns same function instance (identity)', () => {
    const reg = makeRegistry();
    const r1: t.SlugViewRenderer = () => 'A';
    reg.register('a', r1);
    expect(reg.get('a')).to.equal(r1); // identity
  });

  it('list: preserves registration order and exposes meta', () => {
    const reg = makeRegistry();
    const rA: t.SlugViewRenderer = () => 'A';
    const rB: t.SlugViewRenderer = () => 'B';
    reg.register('a', rA);
    reg.register('b', rB, { aliases: ['beta'] });

    const list = reg.list();
    expect(list.map((x) => x.id)).to.eql(['a', 'b']);
    expect(list[0].meta).to.eql(undefined);
    expect(list[1].meta).to.eql({ aliases: ['beta'] });
  });

  it('register: overwriting keeps original order; get returns latest renderer', () => {
    const reg = makeRegistry();
    const r1: t.SlugViewRenderer = () => 'v1';
    const r2: t.SlugViewRenderer = () => 'v2';
    const ry: t.SlugViewRenderer = () => 'y';

    reg.register('x', r1);
    reg.register('y', ry);
    reg.register('x', r2); // overwrite same id

    expect(reg.get('x')).to.equal(r2); // identity
    expect(reg.get('y')).to.equal(ry); // identity

    const ids = reg.list().map((x) => x.id);
    expect(ids).to.eql(['x', 'y']); // insertion order unchanged
  });

  it('register: returns registry (chainable) and preserves identity', () => {
    const reg = makeRegistry();
    const rA: t.SlugViewRenderer = () => 'A';
    const rB: t.SlugViewRenderer = () => 'B';

    const returned = reg.register('a', rA);
    expect(returned).to.equal(reg);
    expectTypeOf(returned).toEqualTypeOf<t.SlugViewRegistry>();

    reg.register('a', rA).register('b', rB); // chain

    expect(reg.get('a')).to.equal(rA); // identity
    expect(reg.get('b')).to.equal(rB); // identity
    expect(reg.list().map((x) => x.id)).to.eql(['a', 'b']);
  });

  it('types: list() returns SlugViewRegistryItem[]', () => {
    const reg = makeRegistry();
    const r: t.SlugViewRenderer = () => null;
    reg.register('z', r, { aliases: ['zee'] });

    const items = reg.list();
    expectTypeOf(items).toEqualTypeOf<t.SlugViewRegistryItem[]>();
    expectTypeOf(items[0]).toEqualTypeOf<t.SlugViewRegistryItem>();
    expect(items[0]).to.eql({ id: 'z', meta: { aliases: ['zee'] } });
  });
});
