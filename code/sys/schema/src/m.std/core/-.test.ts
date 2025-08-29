import { type t, describe, expect, Immutable, it, Type, Value } from '../../-test.ts';
import { ImmutableRefSchema, ImmutableRefSchemaId } from './mod.ts';

describe('schemas: @sys/schema/std (core)', () => {
  it('module exports', async () => {
    const m = await import('@sys/schema/std');
    expect(m).to.be.ok;
    expect(m.ImmutableRefSchema).to.equal(ImmutableRefSchema);
  });

  describe('ImmutableRef', () => {
    it('exports: has stable $id and object shape', () => {
      expect(typeof ImmutableRefSchema).to.eql('object');

      // $id is stable for cross-package $ref usage:
      expect(ImmutableRefSchema.$id).to.eql('urn:sys:schema:immutable-ref');
      expect(ImmutableRefSchema.$id).to.eql(ImmutableRefSchemaId);

      // basic JSON Schema surface:
      expect(ImmutableRefSchema.type).to.eql('object');
      expect(ImmutableRefSchema.required).to.eql(['instance', 'current', 'change', 'events']);
      expect(ImmutableRefSchema.additionalProperties).to.eql(true);
      expect(ImmutableRefSchema.properties.instance.type).to.eql('string');
    });

    it('runtime validation: minimal valid handle passes', () => {
      type T = { count: number };
      const obj = Immutable.clonerRef<T>({ count: 0 });
      expect(Value.Check(ImmutableRefSchema, obj)).to.eql(true);
    });

    it('runtime validation: rejects missing required keys', () => {
      const missingInstance = { change: () => {}, events: () => {} };
      const missingChange = { instance: 'id', events: () => {} };
      const missingEvents = { instance: 'id', change: () => {} };

      expect(Value.Check(ImmutableRefSchema, missingInstance)).to.eql(false);
      expect(Value.Check(ImmutableRefSchema, missingChange)).to.eql(false);
      expect(Value.Check(ImmutableRefSchema, missingEvents)).to.eql(false);
    });

    it('schema shape: ImmutableRefSchema has stable $id', () => {
      // @ts-ignore runtime property
      expect(ImmutableRefSchema.$id).to.eql('urn:sys:schema:immutable-ref');
    });

    it('schema shape: Type.Ref uses $id', () => {
      const WithRef = Type.Object({ state: Type.Ref(ImmutableRefSchema) });
      expect(WithRef.properties.state.$ref).to.eql('urn:sys:schema:immutable-ref');
    });

    it('types: ImmutableRef is assignable to inferred schema type (loose)', () => {
      type T = { count: number };
      type S = t.Infer<typeof ImmutableRefSchema>;
      type P = { state?: S };

      const state = Immutable.clonerRef<T>({ count: 0 });

      // good: must type-check
      ({ state }) satisfies P;

      // bad: deliberately wrong; assert that it FAILS type-checking
      // @ts-expect-error – does not satisfy P (invalid shape)
      ({ state: { foo: 'hello' } }) satisfies P;
    });
  });
});
