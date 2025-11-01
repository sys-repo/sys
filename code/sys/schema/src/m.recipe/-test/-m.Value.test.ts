import { describe, expect, it } from '../../-test.ts';
import { Value as TB } from '../../m.schema/mod.ts';
import { V, Value } from '../mod.ts';
import { toSchema } from '../u.toSchema.ts';

describe('V: Value (schema)', () => {
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
