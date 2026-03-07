import { describe, expect, it } from '../../-test.ts';
import { V, Value } from '../mod.ts';

describe('V: Value (schema)', () => {
  it('API', async () => {
    const m = await import('@sys/schema/recipe');
    expect(m.V).to.equal(V);
    expect(m.Value).to.equal(Value);
    expect(V).to.equal(Value);
  });

  it('string/number/boolean/literal basics', () => {
    const s = V.string({ pattern: '^foo' });
    const n = V.number({ minimum: 1 });
    const b = V.boolean({ title: 'flag' });
    const l = V.literal('abc');

    expect(s.kind).to.eql('string');
    expect(n.kind).to.eql('number');
    expect(b.kind).to.eql('boolean');
    expect(l.kind).to.eql('literal');
    expect(l.value).to.eql('abc');

    expect(Object.isFrozen(s)).to.eql(false); // plain value, no freezing
  });

  it('array and object composition', () => {
    const item = V.string();
    const arr = V.array(item);
    const obj = V.object({ foo: item, bar: V.number() });

    expect(arr.kind).to.eql('array');
    expect(arr.items.kind).to.eql('string');
    expect(obj.kind).to.eql('object');
    expect(Object.keys(obj.props)).to.eql(['foo', 'bar']);
  });

  it('array length constraints: forwards minItems/maxItems', () => {
    const item = V.string();

    const one = V.array(item, { minItems: 1, maxItems: 1 });
    const two = V.array(item, { minItems: 2, maxItems: 2 });
    const four = V.array(item, { minItems: 4, maxItems: 4 });

    expect(one.kind).to.eql('array');
    expect(one.items.kind).to.eql('string');
    expect(one.minItems).to.eql(1);
    expect(one.maxItems).to.eql(1);

    expect(two.kind).to.eql('array');
    expect(two.items.kind).to.eql('string');
    expect(two.minItems).to.eql(2);
    expect(two.maxItems).to.eql(2);

    expect(four.kind).to.eql('array');
    expect(four.items.kind).to.eql('string');
    expect(four.minItems).to.eql(4);
    expect(four.maxItems).to.eql(4);
  });

  it('union and optional composition', () => {
    const u = V.union([V.literal('a'), V.literal('b')]);
    const o = V.optional(V.number());

    expect(u.kind).to.eql('union');
    expect(u.variants).to.have.length(2);
    expect(o.kind).to.eql('optional');
    expect(o.of.kind).to.eql('number');
  });

  it('produces pure plain objects (no prototype pollution)', () => {
    const x = V.object({ nested: V.string() });
    expect(Object.getPrototypeOf(x)).to.equal(Object.prototype);
    expect(JSON.parse(JSON.stringify(x)).kind).to.eql('object');
  });
});
