import { V } from '../mod.ts';
import { describe, expect, it } from '../../-test.ts';
import { Value as TB } from '../../m.schema/mod.ts';
import { toSchema } from '../u.toSchema.ts';

describe('toSchema (compile)', () => {
  it('string: pattern + minLength', () => {
    const r = V.string({ pattern: '^a', minLength: 1 });
    const s = toSchema(r);
    expect(TB.Check(s, 'a')).to.eql(true);
    expect(TB.Check(s, 'aa')).to.eql(true);
    expect(TB.Check(s, 'b')).to.eql(false);
    expect(TB.Check(s, '')).to.eql(false);
  });

  it('number: min/max and exclusives', () => {
    const r = V.number({ minimum: 0, maximum: 10, exclusiveMaximum: undefined });
    const s = toSchema(r);
    expect(TB.Check(s, 0)).to.eql(true);
    expect(TB.Check(s, 10)).to.eql(true);
    expect(TB.Check(s, -1)).to.eql(false);
    expect(TB.Check(s, 11)).to.eql(false);
  });

  it('boolean', () => {
    const s = toSchema(V.boolean());
    expect(TB.Check(s, true)).to.eql(true);
    expect(TB.Check(s, false)).to.eql(true);
    expect(TB.Check(s, 'true')).to.eql(false);
  });

  it('literal', () => {
    const s = toSchema(V.literal('abc'));
    expect(TB.Check(s, 'abc')).to.eql(true);
    expect(TB.Check(s, 'abd')).to.eql(false);
  });

  it('array(items) and object(props) with additionalProperties=false by default', () => {
    const Person = V.object({
      name: V.string({ minLength: 1 }),
      age: V.number({ minimum: 0 }),
    });
    const s = toSchema(Person);

    expect(TB.Check(s, { name: 'Ada', age: 30 })).to.eql(true);
    expect(TB.Check(s, { name: '', age: 30 })).to.eql(false); // minLength
    expect(TB.Check(s, { name: 'Ada' })).to.eql(false); // missing required prop
    expect(TB.Check(s, { name: 'Ada', age: 30, extra: true })).to.eql(false); // no extras

    const sArr = toSchema(V.array(Person));
    expect(TB.Check(sArr, [{ name: 'A', age: 1 }])).to.eql(true);
    expect(TB.Check(sArr, [{ name: 'A', age: -1 }])).to.eql(false);
  });

  it('array length constraints: enforces minItems/maxItems (exact 1|2|4)', () => {
    const scalar = V.union([V.number({ minimum: 0 }), V.string()]);
    const one = V.array(scalar, { minItems: 1, maxItems: 1 });
    const two = V.array(scalar, { minItems: 2, maxItems: 2 });
    const four = V.array(scalar, { minItems: 4, maxItems: 4 });
    const s = toSchema(V.union([one, two, four]));

    const ok = [[8], ['8'], [8, 12], ['8', '12'], [8, 12, 16, 4]];
    const bad = [[], [8, 12, 16], [-1], [8, -12], [8, true, 0, 0]];

    for (const v of ok) expect(TB.Check(s, v)).to.eql(true);
    for (const v of bad) expect(TB.Check(s, v)).to.eql(false);
  });

  it('union([...])', () => {
    const s = toSchema(V.union([V.literal('a'), V.literal('b')]));
    expect(TB.Check(s, 'a')).to.eql(true);
    expect(TB.Check(s, 'b')).to.eql(true);
    expect(TB.Check(s, 'c')).to.eql(false);
  });

  it('optional(of) inside object', () => {
    const Foo = V.object({
      foo: V.optional(V.number({ minimum: 1 })),
    });
    const s = toSchema(Foo);

    expect(TB.Check(s, {})).to.eql(true); // optional
    expect(TB.Check(s, { foo: 2 })).to.eql(true);
    expect(TB.Check(s, { foo: 0 })).to.eql(false);
    expect(TB.Check(s, { foo: '2' })).to.eql(false);
    expect(TB.Check(s, { foo: 2, extra: 1 })).to.eql(false); // no extras
  });

  it('record: string-keyed map with value schema', () => {
    const Rec = V.record(V.number({ minimum: 0 }), { keyPattern: '^foo-' });
    const s = toSchema(Rec);

    // Keys are arbitrary strings; all values must satisfy the inner schema.
    expect(TB.Check(s, { 'foo-1': 0, 'bar-2': 42 })).to.eql(true);

    // invalid: value violates inner minimum constraint
    expect(TB.Check(s, { 'foo-1': -1 })).to.eql(false);
  });

  it('compiler does not mutate the input recipe (purity)', () => {
    const recipe = V.object({
      a: V.string({ minLength: 1 }),
      b: V.optional(V.number()),
    });
    const before = JSON.stringify(recipe);
    // compile
    void toSchema(recipe);
    const after = JSON.stringify(recipe);
    expect(after).to.eql(before);
  });
});
