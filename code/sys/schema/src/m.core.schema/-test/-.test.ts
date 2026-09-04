import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Schema, Type, Value } from '../mod.ts';

describe('Schema', () => {
  it('API', async () => {
    const m = await import('@sys/schema');
    const { Error } = await import('../m.Error.ts');
    expect(m.Schema).to.equal(Schema);
    expect(m.Type).to.equal(Type);
    expect(m.Value).to.equal(Value);
    expect(m.Schema.Error).to.equal(Error);
  });

  it('freezes every namespace API', () => {
    expect(Object.isFrozen(Schema)).to.eql(true);
    expect(Object.isFrozen(Type)).to.eql(true);
    expect(Object.isFrozen(Value)).to.eql(true);
    expect(Object.isFrozen(Schema.Error)).to.eql(true);
  });

  it('Type/Value author and validate runtime schemas', () => {
    const { Type, Value } = Schema;

    // Define type:
    const T = Type.Object({
      id: Type.Integer(),
      name: Type.Optional(Type.String({ description: 'Display name.' })),
    });

    type T = t.Static<typeof T>; // Invert proper TS type.
    expectTypeOf({} as T).toEqualTypeOf<{ id: number; name?: string }>();
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

  describe('Schema.Type / Schema.Value contract', () => {
    const { Type, Value } = Schema;

    it('Value.Parse materializes canonical object values', () => {
      const T = Type.Object({ foo: Type.String() }, { additionalProperties: false });
      const result = Value.Parse(T, { foo: 'ok', noise: true });
      expect(result).to.eql({ foo: 'ok' });
    });

    it('Value.Errors returns JSON-pointer diagnostics with schema/value evidence', () => {
      const T = Type.Object({ foo: Type.String() }, { additionalProperties: false });
      const errors = Value.Errors(T, { noise: true });

      expect(errors.some((e) => e.path === '/noise' && e.message === 'Unexpected property')).to.eql(
        true,
      );
      expect(
        errors.some((e) => e.path === '/foo' && e.message === 'Expected required property'),
      ).to.eql(true);
      expect(errors.First()).to.equal(errors[0]);

      const noise = errors.find((e) => e.path === '/noise');
      expect(noise?.schema).to.equal(T);
      expect(noise?.value).to.eql(true);

      const length = Value.Errors(Type.String({ minLength: 2 }), 'x');
      expect(length[0]?.message).to.include('string length');

      const union = Value.Errors(Type.Union([Type.Literal('a'), Type.Literal('b')]), 'c');
      expect(union.some((e) => e.message === 'Expected union value')).to.eql(true);
    });

    it('Type.Recursive builds named recursive schemas with stable identity', () => {
      const Node = Type.Recursive(
        (Self) =>
          Type.Object(
            {
              name: Type.String(),
              child: Type.Optional(Self),
            },
            { additionalProperties: false },
          ),
        { $id: 'Node', title: 'Node' },
      );

      expect((Node as t.TSchema).$id).to.eql('Node');
      expect(Value.Check(Node, { name: 'root', child: { name: 'leaf' } })).to.eql(true);
      expect(Value.Check(Node, { name: 'root', child: { name: 123 } })).to.eql(false);

      const errors = Value.Errors(Node, { name: 'root', child: { name: 123 } });
      const hasChildNameError = errors.some((e) => {
        return e.path === '/child/name' && e.message === 'Expected string';
      });
      expect(hasChildNameError).to.eql(true);
    });
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

    it('returns a fail result when schema validation fails', () => {
      const result = Schema.try(() => Value.Parse(SampleSchema, { foo: {} }));
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema validation failure');

      expect(Array.isArray(result.errors)).to.eql(true);
      const [err] = result.errors;

      expect(err.message).to.include('Expected string');
      expect(err.path).to.eql('/foo');
    });

    it('propagates unexpected errors', () => {
      const fn = () => {
        Schema.try(() => {
          throw new Error('boom');
        });
      };
      expect(fn).to.throw();
    });
  });
});
