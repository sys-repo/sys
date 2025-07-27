import { Schema } from '@sys/std/schema';
import { type t, describe, expect, it } from '../-test.ts';

describe('Standard Schema', () => {
  it('API', async () => {
    const m = await import('@sys/std/schema');
    expect(m.Schema).to.equal(Schema);
    expect(m.Type).to.equal(Schema.Type);
    expect(m.Value).to.equal(Schema.Value);
  });

  /**
   * https://github.com/sinclairzx81/typebox
   */
  it('Hello, World', () => {
    const { Type, Value } = Schema;

    // Define type:
    const T = Type.Object({
      id: Type.Integer(),
      name: Type.Optional(Type.String()),
    });

    type T = t.Static<typeof T>; // Invert proper TS type.
    const value = {
      id: 123,
      name: 'foo',
      noise: '👋',
    };

    // Check: validate values:
    expect(Value.Check(T, value)).to.eql(true);
    expect(Value.Check(T, { id: 0 })).to.eql(true);
    expect(Value.Check(T, { msg: 'hello' })).to.eql(false);

    // Clean: remove noise:
    const cleaned = Value.Clean(T, Value.Clone(value));
    expect(cleaned).to.eql({ id: 123, name: 'foo' });
    expect(cleaned).to.not.eql(value);

    // Assert (throw):
    Schema.Value.Assert(T, value);
    const fn = () => Value.Assert(T, { msg: '🐷' });
    expect(fn).to.throw(/Expected required property/);
  });
});
