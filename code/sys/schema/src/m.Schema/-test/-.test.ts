import { type t, describe, expect, it } from '../../-test.ts';
import { ErrorMapper } from '../m.ErrorMapper.ts';
import { Schema, Type, Value } from '../mod.ts';

describe('Standard Schema', () => {
  it('API', async () => {
    const m = await import('@sys/schema');
    expect(m.Schema).to.equal(Schema);
    expect(m.Type).to.equal(Type);
    expect(m.Value).to.equal(Value);
    expect(m.Schema.ErrorMapper).to.equal(ErrorMapper);
  });

  /**
   * https://github.com/sinclairzx81/typebox
   */
  it('Hello, World', () => {
    const { Type, Value } = Schema;

    // Define type:
    const T = Type.Object({
      id: Type.Integer(),
      name: Type.Optional(Type.String({ description: 'Display name.' })),
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

    /** Sample schema for the tests */
    const SampleSchema = Type.Object({
      foo: Type.String(),
      bar: Type.Optional(Type.Number()),
    });

    it('returns an ok result when the inner function succeeds', () => {
      const result = Schema.try(() => Value.Parse(SampleSchema, { foo: 'hello', bar: 1 }));
      expect(result).to.eql({
        ok: true,
        value: { foo: 'hello', bar: 1 },
      });
    });

    it('returns a fail result when TypeBox validation fails', () => {
      const result = Schema.try(() => Value.Parse(SampleSchema, { foo: {} }));
      expect(result.ok).to.eql(false);

      expect(Array.isArray((result as any).errors)).to.eql(true);
      const [err] = (result as Extract<typeof result, { ok: false }>).errors;

      expect(err.message).to.include('Expected string');
      expect(err.path).to.eql('/foo');
    });

    it('propagates unexpected (non-TypeBox) errors', () => {
      const fn = () => {
        Schema.try(() => {
          throw new Error('boom');
        });
      };
      expect(fn).to.throw();
    });
  });
});
