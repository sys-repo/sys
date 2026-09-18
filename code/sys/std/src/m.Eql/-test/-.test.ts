import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { deep, unique, uniqueBy } from '../m.Eql.ts';
import { Eql } from '../mod.ts';

describe('Eql', () => {
  it('API', async () => {
    const m = await import('@sys/std/eql');

    expect(m.Eql).to.equal(Eql);
    expect(Object.isFrozen(Eql)).to.eql(true);
    expect(Eql.deep).to.equal(deep);
    expect(Eql.unique).to.equal(unique);
    expect(Eql.uniqueBy).to.equal(uniqueBy);
    expectTypeOf(Eql).toEqualTypeOf<t.Eql.Lib>();
  });

  it('compares values through the structural equality kernel', () => {
    expect(Eql.deep(NaN, NaN)).to.eql(true);
    expect(Eql.deep(0, -0)).to.eql(false);
    expect(
      Eql.deep({ a: 1, b: [{ c: 2 }] }, { a: 1, b: [{ c: 2 }] }),
    ).to.eql(true);
    expect(
      Eql.deep({ a: 1, b: [{ c: 2 }] }, { a: 1, b: [{ c: 3 }] }),
    ).to.eql(false);
  });

  it('dedupes structurally equal values while preserving first occurrence', () => {
    const first = { id: 1 };
    const duplicate = { id: 1 };
    const distinct = { id: 2 };
    const input = [first, duplicate, distinct];

    const result = Eql.unique(input);

    expect(result).to.eql([first, distinct]);
    expect(result).not.equal(input);
    expect(input).to.eql([first, duplicate, distinct]);
  });

  it('dedupes structurally equal keys while preserving first occurrence', () => {
    const first = { key: { id: 1 }, value: 'first' };
    const duplicate = { key: { id: 1 }, value: 'duplicate' };
    const distinct = { key: { id: 2 }, value: 'distinct' };
    const input = [first, duplicate, distinct];

    const result = Eql.uniqueBy((item) => item.key, input);

    expect(result).to.eql([first, distinct]);
    expect(result).not.equal(input);
    expect(input).to.eql([first, duplicate, distinct]);
  });
});
