import { type t, describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { Value } from '../common.ts';
import { ConceptLayoutPropsSchema, Is, Traits } from '../mod.ts';

describe('schema.concept-layout', () => {
  const S = Traits.Schema.ConceptLayout.Props;

  it('API', () => {
    expect(Traits.Schema.ConceptLayout.Props).to.equal(ConceptLayoutPropsSchema);
  });

  describe('Is.conceptLayoutProps', () => {
    it('signature', () => {
      type Expect = (u: unknown) => u is t.ConceptLayoutProps;
      expectTypeOf(Is.conceptLayoutProps).toEqualTypeOf<Expect>();
    });

    it('runtime truth table', () => {
      const ok = { slug: 'crdt:create' };
      const bad = { slug: 'nope' };
      const noise = { slug: 'crdt:create', extra: true } as unknown;

      expect(Is.conceptLayoutProps(ok)).to.eql(true);
      expect(Is.conceptLayoutProps(bad)).to.eql(false);
      expect(Is.conceptLayoutProps(noise)).to.eql(false);
      expect(Is.conceptLayoutProps(undefined)).to.eql(false);
    });

    it('narrows', () => {
      const input: unknown = { slug: 'crdt:create' };
      if (Is.conceptLayoutProps(input)) {
        expectTypeOf(input.slug).toEqualTypeOf<string>();
      } else {
        expect(true).to.eql(false);
      }
    });
  });

  describe('schema', () => {
    it('valid: crdt ref forms', () => {
      for (const v of [
        { slug: 'crdt:create' },
        { slug: 'crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P' },
        { slug: 'crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P/path' },
        { slug: 'urn:crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P' },
      ])
        expect(Value.Check(S, v)).to.eql(true);
    });

    it('invalid: non-crdt strings, missing prop, noise', () => {
      for (const v of [
        {},
        { slug: '' },
        { slug: 'not-a-crdt' },
        { slug: 'http://example.com' },
        { slug: 'crdt:' },
        { slug: 'urn:crdt:' },
        { slug: 'crdt:bad id' },
        { slug: 'crdt:create', extra: true } as unknown,
      ])
        expect(Value.Check(S, v as unknown)).to.eql(false);
    });
  });
});
