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

  describe('Schema.try', () => {
    const { Type, Value } = Schema;
    const safeTry = Schema.try;

    /** Sample schema for the tests */
    const SampleSchema = Type.Object({
      foo: Type.String(),
      bar: Type.Optional(Type.Number()),
    });

    it('returns an ok result when the inner function succeeds', () => {
      const result = safeTry(() => Value.Parse(SampleSchema, { foo: 'hello', bar: 1 }));
      expect(result).to.eql({
        ok: true,
        value: { foo: 'hello', bar: 1 },
      });
    });

    it('returns a fail result when TypeBox validation fails', () => {
      const result = safeTry(() => Value.Parse(SampleSchema, { foo: {} }));
      expect(result.ok).to.eql(false);
      expect(result.error?.message).to.include('Expected string');
      expect(result.error?.path).to.eql('/foo');
    });

    it('propagates unexpected (non-TypeBox) errors', () => {
      const fn = () =>
        safeTry(() => {
          throw new Error('boom');
        });
      expect(fn).to.throw();
    });
  });
});
